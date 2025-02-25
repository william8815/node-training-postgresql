const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')

const saltRounds = 10

const { isUndefined, isNotValidSting } = require("../utils/validUtils")

// POST : 註冊用戶
router.post("/signup", async (req, res, next) => {
    try {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
        const { name, email, password } = req.body
        const isNotValidName = isUndefined(name) || isNotValidSting(name)
        const isNotValidEmail = isUndefined(email) || isNotValidSting(email)
        const isNotValidPassword = isUndefined(password) || isNotValidSting(password)
        if (isNotValidName || isNotValidEmail || isNotValidPassword) {
            logger.warn("欄位未填寫正確")
            res.status(400).json({
                status: "failed",
                message: "欄位未填寫正確"
            })
            return
        }
        if (!passwordPattern.test(password)) {
            logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
            res.status(400).json({
                status: 'failed',
                message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
            })
            return
        }
        const userRepo = dataSource.getRepository('User')
        // 檢查 email 是否存在
        const existUser = await userRepo.findOne({
            where: {
                email: email
            }
        })
        if (existUser) {
            logger.warn('建立使用者錯誤: Email 已被使用')
            res.status(409).json({
                status: 'failed',
                message: 'Email 已被使用'
            })
            return
        }
        // 建立新使用者
        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newUser = userRepo.create({
            name,
            email,
            role: "USER",
            password: hashPassword
        })
        const result = await userRepo.save(newUser)
        logger.info('新建立的使用者ID:', result.id)
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: result.id,
                    name: result.name
                }
            }
        })
    } catch (error) {
        logger.error('建立使用者錯誤:',error)
        next(error)
    }
})

module.exports = router
