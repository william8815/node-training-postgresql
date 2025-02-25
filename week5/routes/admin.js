const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')

const { isUndefined, isNotValidSting, isNotValidInteger } = require("../utils/validUtils")

// POST: 教練新增課程
router.post('/coaches/courses', async (req, res, next) => {
    try {
        const {
            user_id: userId, skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
            max_participants: maxParticipants, meeting_url: meetingUrl
        } = req.body
        const isNotValidUserId = isUndefined(userId) || isNotValidSting(userId)
        const isNotValidSkillId = isUndefined(skillId) || isNotValidSting(skillId)
        const isNotValidName = isUndefined(name) || isNotValidSting(name)
        const isNotValidDescription = isUndefined(description) || isNotValidSting(description)
        const isNotValidStartAt = isUndefined(startAt) || isNotValidSting(startAt)
        const isNotValidEndAt = isUndefined(endAt) || isNotValidSting(endAt)
        const isNotValidMaxParticipants = isUndefined(maxParticipants) || isNotValidInteger(maxParticipants)
        const isNotValidMeetingUrl = isUndefined(meetingUrl) || isNotValidSting(meetingUrl) || !meetingUrl.startsWith('https')
        if (isNotValidUserId || isNotValidSkillId || isNotValidName || isNotValidDescription || isNotValidStartAt || isNotValidEndAt || isNotValidMaxParticipants || isNotValidMeetingUrl) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        const userRepo = dataSource.getRepository('User')
        const existUser = await userRepo.findOne({
            select: ['id', 'name', 'role'],
            where: { id: userId }
        })
        if (!existUser) {
            logger.warn('使用者不存在')
            res.status(400).json({
                status: 'failed',
                message: '使用者不存在'
            })
            return
        } else if (existUser.role !== 'COACH') {
            logger.warn('使用者尚未成為教練')
            res.status(400).json({
                status: 'failed',
                message: '使用者尚未成為教練'
            })
            return
        }
        // 是使用者 也是教練 才能新增課程
        const courseRepo = dataSource.getRepository('Course')
        const newCourse = courseRepo.create({
            user_id: userId,
            skill_id: skillId,
            name,
            description,
            start_at: startAt,
            end_at: endAt,
            max_participants: maxParticipants,
            meeting_url: meetingUrl
        })
        const savedCourse = await courseRepo.save(newCourse)
        const course = await courseRepo.findOne({
            where: { id: savedCourse.id }
        })
        res.status(201).json({
            status: 'success',
            data: {
                course
            }
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})
// PUT : 編輯教練課程
router.put('/coaches/courses/:courseId', async (req, res, next) => {
    try {
        const { courseId } = req.params
        const {
            skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
            max_participants: maxParticipants, meeting_url: meetingUrl
        } = req.body
        const isNotValidCourseId = isNotValidSting(courseId)
        const isNotValidSkillId = isUndefined(skillId) || isNotValidSting(skillId)
        const isNotValidName = isUndefined(name) || isNotValidSting(name)
        const isNotValidDescription = isUndefined(description) || isNotValidSting(description)
        const isNotValidStartAt = isUndefined(startAt) || isNotValidSting(startAt)
        const isNotValidEndAt = isUndefined(endAt) || isNotValidSting(endAt)
        const isNotValidMaxParticipants = isUndefined(maxParticipants) || isNotValidInteger(maxParticipants)
        const isNotValidMeetingUrl = isUndefined(meetingUrl) || isNotValidSting(meetingUrl) || !meetingUrl.startsWith('https')

        if (isNotValidCourseId || isNotValidSkillId || isNotValidName || isNotValidDescription || isNotValidStartAt || isNotValidEndAt || isNotValidMaxParticipants || isNotValidMeetingUrl) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        // 課程是否已存在
        const courseRepo = dataSource.getRepository('Course')
        const existCourse = await courseRepo.findOne({
            where: { id: courseId }
        })
        if (!existCourse) {
            logger.warn('課程不存在')
            res.status(400).json({
                status: 'failed',
                message: '課程不存在'
            })
            return
        }
        const updateCourse = await courseRepo.update({
            id: courseId
        }, {
            skill_id: skillId,
            name,
            description,
            start_at: startAt,
            end_at: endAt,
            max_participants: maxParticipants,
            meeting_url: meetingUrl
        })
        if (updateCourse.affected === 0) {
            logger.warn('更新課程失敗')
            res.status(400).json({
                status: 'failed',
                message: '更新課程失敗'
            })
            return
        }
        const savedCourse = await courseRepo.findOne({
            where: { id: courseId }
        })
        res.status(200).json({
            status: 'success',
            data: {
                course: savedCourse
            }
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})
// POST : 將使用者新增為教練
router.post("/coaches/:userId", async (req, res, next) => {
    try {
        const { userId } = req.params
        const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
        const isNotValidExperienceYears = isUndefined(experienceYears) || isNotValidInteger(experienceYears)
        const isNotValidDescription = isUndefined(description) || isNotValidSting(description)
        if (isNotValidExperienceYears || isNotValidDescription) {
            logger.warn('欄位未填寫正確')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        if (profileImageUrl && !isNotValidSting(profileImageUrl) && !profileImageUrl.startsWith('https')) {
            logger.warn('大頭貼網址錯誤')
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確'
            })
            return
        }
        const userRepo = dataSource.getRepository('User')
        const existUser = await userRepo.findOne({
            select: ['id', 'name', 'role'],
            where: { id: userId }
        })
        if (!existUser) {
            logger.warn('使用者不存在')
            res.status(400).json({
                status: 'failed',
                message: '使用者不存在'
            })
            return
        } else if (existUser.role === 'COACH') {
            logger.warn('使用者已經是教練')
            res.status(409).json({
                status: 'failed',
                message: '使用者已經是教練'
            })
            return
        }
        // 使用者存在 但不是教練
        const coachRepo = dataSource.getRepository('Coach')
        const newCoach = coachRepo.create({
            user_id: userId,
            experience_years: experienceYears,
            description,
            profile_image_url: profileImageUrl
        })
        // 更新 user role 欄位
        const updatedUser = await userRepo.update({
            id: userId,
            role: "USER"
        }, {
            role: "COACH"
        })
        if (updatedUser.affected === 0) {
            logger.warn('更新使用者失敗')
            res.status(400).json({
                status: 'failed',
                message: '更新使用者失敗'
            })
            return
        }
        const savedCoach = await coachRepo.save(newCoach)
        const savedUser = await userRepo.findOne({
            select: ['name', 'role'],
            where: { id: userId }
        })
        res.status(201).json({
            status: 'success',
            data: {
                user: savedUser,
                coach: savedCoach
            }
        })
    } catch (error) {
        logger.error(error)
        next(error)
    }
})

module.exports = router