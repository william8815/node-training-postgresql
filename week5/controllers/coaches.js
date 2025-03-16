const { dataSource } = require("../db/data-source")
const logger = require('../utils/logger')('CoachesController')
const { isUndefined, isNotValidSting } = require("../utils/validUtils")
const appError = require('../utils/appError')

const coachesController = {
    async getCoaches(req, res, next) {
        const { per, page } = req.query
        const isNotValidPer = isUndefined(per) || isNotValidSting(per)
        const isNotValidPage = isUndefined(page) || isNotValidSting(page)
        if (isNotValidPer || isNotValidPage) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位為填寫正確"))
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
    },
    async getOneCoach(req, res, next) {
        const { coachId } = req.params
        const isNotValidId = isUndefined(coachId) || isNotValidSting(coachId)
        if (isNotValidId) {
            logger.warn("ID 錯誤")
            next(appError(400, "ID 錯誤"))
            return
        }
        // 取得教練表單
        const coachRepo = dataSource.getRepository("Coach")
        const existCoach = await coachRepo.findOne({
            where: { id: coachId },
        })
        if (!existCoach) {
            logger.warn("找不到該教練")
            next(appError(400, "找不到該教練"))
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
    }
}

module.exports = coachesController