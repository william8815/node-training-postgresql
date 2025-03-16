const express = require('express')
const router = express.Router()
const handleErrorAsync = require('../utils/handleErrorAsync')
const isAuth = require('../middlewares/isAuth')
const coursesController = require('../controllers/courses')

// 報名課程
router.post('/:courseId',isAuth, handleErrorAsync(coursesController.enrollCourse))
// 取消課程
router.delete('/:courseId',isAuth, handleErrorAsync(coursesController.cancelCourse))
// 取得所有課程
router.get("/", handleErrorAsync(coursesController.getCourses))

module.exports = router
