const { IsNull } = require('typeorm')
const { dataSource } = require("../db/data-source")
const appError = require("../utils/appError")
const logger = require("../utils/logger")("CoursesController")
const { isUndefined, isNotValidSting } = require("../utils/validUtils")

const coursesController = {
    async getCourses(req, res, next) {
        const courses = await dataSource.getRepository("Course").find({
            select: ['id', 'name', 'description', 'start_at', 'end_at', 'max_participants'],
            relations: {
                User: true,
                Skill: true
            }
        })
        const newCourses = courses.map(item => ({
            ...item,
            coach_name: item.User?.name || null,
            skill_name: item.Skill?.name || null
        }))
        newCourses.forEach(item => {
            delete item.User
            delete item.Skill
        })
        res.status(200).json({
            status: "success",
            data: newCourses
        })
    },
    async enrollCourse(req, res, next) {
        const { id } = req.user
        const { courseId } = req.params
        if (isUndefined(courseId) || isNotValidSting(courseId)) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位未填寫正確"))
            return
        }
        const existCourse = await dataSource.getRepository("Course").findOne({
            where: { id: courseId }
        })
        if (!existCourse) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        const courseBookingRepo = dataSource.getRepository("CourseBooking")
        const existBooking = await courseBookingRepo.findOne({
            where: {
                user_id: id,
                course_id: courseId
            }
        })
        if (existBooking) {
            logger.warn("已經報名過此課程")
            next(appError(400, "已經報名過此課程"))
            return
        }
        const creditPurchaseRepo = dataSource.getRepository("CreditPurchase")
        const userCredit = await creditPurchaseRepo.sum("purchased_credits", {
            user_id: id
        })
        const userUsedCredit = await courseBookingRepo.count({
            where: {
                user_id: id,
                cancelledAt: IsNull()
            }
        })
        const courseBookingCount = await courseBookingRepo.count({
            where: {
                course_id: courseId,
                cancelledAt: IsNull()
            }
        })
        // 已無可使用堂數：已報名課程總數量(僅自己) >= 已購買課程總數量(僅自己)
        if (userUsedCredit >= userCredit) {
            logger.warn("已無可使用堂數")
            next(appError(400, "已無可使用堂數"))
            return
        }
        // 已達最大參加人數 : 已報名課程總數量(僅該課程) >= 課程的最大參與數量
        if (courseBookingCount >= existCourse.max_participants) {
            logger.warn("已達最大參加人數，無法參加")
            next(appError(400, "已達最大參加人數，無法參加"))
            return
        }
        const newCourseBooking = courseBookingRepo.create({
            user_id: id,
            course_id: courseId
        })
        await courseBookingRepo.save(newCourseBooking)
        res.status(201).json({
            status: 'success',
            data: null
        })
    },
    async cancelCourse(req, res, next) {
        const { id } = req.user
        const { courseId } = req.params
        const courseBookingRepo = dataSource.getRepository('CourseBooking')
        const existCourseBooking = await courseBookingRepo.findOne({
            where: {
                user_id: id,
                course_id: courseId,
                cancelledAt: IsNull()
            }
        })
        if (!existCourseBooking) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        const updateCourseBooking = await courseBookingRepo.update(
            {
                user_id: id,
                course_id: courseId,
                cancelledAt: IsNull()
            },
            {
                cancelledAt: new Date().toISOString()
            }
        )
        if (updateCourseBooking.affected === 0) {
            logger.warn("取消失敗")
            next(appError(400, "取消失敗"))
            return
        }
        res.status(200).json({
            status: 'success',
            data: null
        })
    },
}
module.exports = coursesController