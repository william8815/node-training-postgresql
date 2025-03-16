const { IsNull, In } = require('typeorm')
const bcrypt = require('bcrypt')
const saltRounds = 10
const logger = require("../utils/logger")("UserController")
const { dataSource } = require("../db/data-source")
const appError = require("../utils/appError")
const { isUndefined, isNotValidSting } = require("../utils/validUtils")
const { generateJWT } = require('../utils/jwtUtils')

function isValidPassword(password) {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    return passwordPattern.test(password)
}

const userController = {
    async userSignup(req, res, next) {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
        const { name, email, password } = req.body
        const isNotValidName = isUndefined(name) || isNotValidSting(name)
        const isNotValidEmail = isUndefined(email) || isNotValidSting(email)
        const isNotValidPassword = isUndefined(password) || isNotValidSting(password)
        if (isNotValidName || isNotValidEmail || isNotValidPassword) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位未填寫正確"))
            return
        }
        if (!passwordPattern.test(password)) {
            logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
            next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"))
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
            next(appError(409, "Email 已被使用"))
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
    },
    async userLogin(req, res, next) {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
        const { email, password } = req.body
        const isNotValidEmail = isUndefined(email) || isNotValidSting(email)
        const isNotValidPassword = isUndefined(password) || isNotValidSting(password)
        if (isNotValidEmail || isNotValidPassword) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位未填寫正確"))
            return
        }
        if (!passwordPattern.test(password)) {
            logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
            next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"))
            return
        }
        const userRepo = dataSource.getRepository('User')
        // 驗證：使用者存不存在
        const existUser = await userRepo.findOne({
            select: ['id', 'name', 'password'],
            where: {
                email
            }
        })
        if (!existUser) {
            next(appError(400, '使用者不存在'))
            return
        }
        // 驗證：密碼輸入有無錯誤
        const isPasswordMatch = await bcrypt.compare(password, existUser.password)
        if (!isPasswordMatch) {
            next(appError(400, '密碼輸入錯誤'))
            return
        }
        // 產生 JWT
        const token = generateJWT({
            id: existUser.id,
            role: existUser.role
        })

        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    name: existUser.name
                }
            }
        })
    },
    async getUserProfile(req, res, next) {
        const { id } = req.user
        if (isUndefined(id) || isNotValidSting(id)) {
            next(appError(400, "欄位為填寫正確"))
            return
        }
        const existUser = await dataSource.getRepository("User").findOne({
            where: {
                id
            }
        })
        res.status(200).json({
            status: 'success',
            data: {
                id: existUser.id,
                email: existUser.email,
                name: existUser.name
            }
        })
    },
    async updateUserProfile(req, res, next) {
        const { id } = req.user
        const { name } = req.body
        if (isUndefined(name) || isNotValidSting(name)) {
            next(appError('400', '欄位未填寫正確'))
            return
        }
        const userRepo = dataSource.getRepository('User')
        // 檢查使用者名稱未變更
        const existUser = await userRepo.findOne({
            where: { id }
        })
        if (existUser.name === name) {
            next(appError(400, "使用者名稱未變更"))
            return
        }
        // 更新用戶
        const updateUser = await userRepo.update({
            id
        }, {
            name
        })
        if (updateUser.affected === 0) {
            next(appError(400, "更新使用者失敗"))
            return
        }
        res.status(200).json({
            status: 'success',
        })
    },
    async updatePassword(req, res, next) {
        const { id } = req.user
        const { password, new_password: newPassword, confirm_new_password: confirmNewPassword } = req.body
        const isNotValidPassword = isUndefined(password) && isNotValidSting(password)
        const isNotValidNewPassword = isUndefined(newPassword) && isNotValidSting(newPassword)
        const isNotValidConfirmNewPassword = isUndefined(confirmNewPassword) && isNotValidSting(confirmNewPassword)
        if (isNotValidPassword || isNotValidNewPassword || isNotValidConfirmNewPassword) {
            next(appError('400', '欄位未填寫正確'))
            return
        }
        if (!isValidPassword(password) || !isValidPassword(newPassword) || !isValidPassword(confirmNewPassword)) {
            next(appError('400', '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
            return
        }
        if (newPassword === password) {
            next(appError('400', '新密碼不能與舊密碼相同'))
            return
        }
        if (newPassword !== confirmNewPassword) {
            next(appError('400', '新密碼與驗證密碼不一致'))
            return
        }
        const userRepo = dataSource.getRepository('User')
        const existUser = await userRepo.findOne({
            select: ['password'],
            where: { id }
        })
        const isPasswordMatch = await bcrypt.compare(password, existUser.password)
        if (!isPasswordMatch) {
            next(appError('400', '密碼輸入錯誤'))
            return
        }
        // 密碼加密並更新
        const hashPassword = await bcrypt.hash(newPassword, saltRounds)
        const updateUser = await userRepo.update({
            id
        }, {
            password: hashPassword
        })
        if (updateUser.affected === 0) {
            return next(appError(400, "更新密碼失敗"))
        }
        res.status(200).json({
            status: "success",
            data: null
        })
    },
    async getUserPurchasePackages(req, res, next) {
        let { id } = req.user
        const creditPurchaseRepo = dataSource.getRepository("CreditPurchase")
        const creditPurchaseList = await creditPurchaseRepo.find({
            select: ["purchased_credits", "price_paid", "purchaseAt"],
            where: { user_id: id },
            relations: {
                CreditPackage: true
            }
        })
        let newResults = creditPurchaseList.map(item => ({
            purchased_credits: item.purchased_credits,
            price_paid: item.price_paid,
            name: item.CreditPackage.name,
            purchase_at: item.purchaseAt,
        }))
        res.status(200).json({
            status: "success",
            data: newResults
        })
    },
    async getUserBookingCourses(req, res, next) {
        const { id } = req.user
        const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
        const courseBookingRepo = dataSource.getRepository("CourseBooking")
        const userCredit = await creditPurchaseRepo.sum('purchased_credits', {
            user_id: id
        })
        const userUsedCredit = await courseBookingRepo.count({
            where: {
                user_id: id,
                cancelledAt: IsNull()
            }
        })
        const courseBookingList = await courseBookingRepo.find({
            select: {
                course_id: true,
                Course: {
                    name: true,
                    start_at: true,
                    end_at: true,
                    meeting_url: true,
                    user_id: true
                }
            },
            where: {
                user_id: id
            },
            order: {
                Course: {
                    start_at: 'ASC'
                }
            },
            relations: {
                Course: true
            }
        })
        const coachUserIdMap = {}
        if (courseBookingList.length > 0) {
            courseBookingList.forEach((courseBooking) => {
                coachUserIdMap[courseBooking.Course.user_id] = courseBooking.Course.user_id
            })
            const userRepo = dataSource.getRepository('User')
            const coachUsers = await userRepo.find({
                select: ['id', 'name'],
                where: {
                    id: In(Object.values(coachUserIdMap))
                }
            })
            coachUsers.forEach((user) => {
                coachUserIdMap[user.id] = user.name
            })
            logger.debug(`courseBookingList: ${JSON.stringify(courseBookingList)}`)
            logger.debug(`coachUsers: ${JSON.stringify(coachUsers)}`)
        }
        let result = {
            credit_remain: userCredit - userUsedCredit,
            credit_usage: userUsedCredit,
            course_booking: courseBookingList.map((courseBooking) => {
            return {
                course_id: courseBooking.course_id,
                name: courseBooking.Course.name,
                start_at: courseBooking.Course.start_at,
                end_at: courseBooking.Course.end_at,
                meeting_url: courseBooking.Course.meeting_url,
                coach_name: coachUserIdMap[courseBooking.Course.user_id]
            }
            })
        }
        res.status(200).json({
            status: "success",
            data: result
        })
    }
}

module.exports = userController