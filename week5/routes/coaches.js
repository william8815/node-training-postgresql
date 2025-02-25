const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')

const { isUndefined, isNotValidSting } = require("../utils/validUtils")

// GET : 取得教練清單
router.get("/", async (req, res, next) => {
    try {
        const { per, page } = req.query
        const isNotValidPer = isUndefined(per) || isNotValidSting(per)
        const isNotValidPage = isUndefined(page) || isNotValidSting(page)
        if (isNotValidPer || isNotValidPage) {
            logger.warn("欄位未填寫正確")
            res.status(400).json({
                status: "failed",
                message: "欄位為填寫正確"
            })
            return
        }
        // 取得教練表單
        const perNum = parseInt(per)
        const pageNum = parseInt(page)
        const coachRepo = dataSource.getRepository("Coach")
        const allCoach = await coachRepo.find({
            skip: (pageNum - 1) * perNum,
            take: perNum,
            relations: {
                User: true
            }
        })

        res.status(200).json({
            status: "success",
            data: allCoach
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})
// GET : 取得教練詳細資訊
router.get("/:coachId", async (req, res, next) => {
    try {
        const { coachId } = req.params
        const isNotValidId = isUndefined(coachId) || isNotValidSting(coachId)
        if (isNotValidId) {
            logger.warn("ID 錯誤")
            res.status(400).json({
                status: "failed",
                message: "ID 錯誤"
            })
            return
        }
        // 取得教練表單
        const coachRepo = dataSource.getRepository("Coach")
        const existCoach = await coachRepo.findOne({
            where : {id : coachId},
        })
        if (!existCoach) {
            logger.warn("找不到該教練")
            res.status(400).json({
                status: "failed",
                message: "找不到該教練"
            })
            return
        }
        let data = {
            user: null,
            coach: existCoach
        }
        if (existCoach.user_id) {
            const userRepo = dataSource.getRepository('User')
            const existUser = await userRepo.findOne({
                select: ['name', 'role'],
                where: { id: existCoach.user_id }
            })
            data.user = {
                name: existUser.name,
                role: existUser.role
            }
        }
        res.status(200).json({
            status: "success",
            data: data
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router