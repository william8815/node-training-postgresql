const express = require('express')
const router = express.Router()
const isAuth = require('../middlewares/isAuth')
const isCoach = require('../middlewares/isCoach')
const handleErrorAsync = require('../utils/handleErrorAsync')
const adminController = require('../controllers/admin')

// POST: 教練新增課程
router.post('/coaches/courses', isAuth, isCoach, handleErrorAsync(adminController.postCoachCorse))
// PUT : 編輯教練課程
router.put('/coaches/courses/:courseId', isAuth, isCoach, handleErrorAsync(adminController.putCoachCorse))
// POST : 將使用者新增為教練
router.post("/coaches/:userId", handleErrorAsync(adminController.postUserToCoach))

module.exports = router