const express = require('express')
const router = express.Router()

const isAuth = require('../middlewares/isAuth')
const handleErrorAsync = require('../utils/handleErrorAsync')
const userController = require("../controllers/user")

// POST : 註冊用戶
router.post("/signup", handleErrorAsync(userController.userSignup))
// POST : 登入
router.post("/login", handleErrorAsync(userController.userLogin))
// GET : 取得用戶資料
router.get('/profile', isAuth, handleErrorAsync(userController.getUserProfile))
// PUT : 更新用戶資料
router.put('/profile', isAuth, handleErrorAsync(userController.updateUserProfile))
// PUT : 更改密碼
router.put("/password", isAuth, handleErrorAsync(userController.updatePassword))
// GET : 取得使用者已購買的方案列表
router.get("/credit-package", isAuth, handleErrorAsync(userController.getUserPurchasePackages))
// GET : 取得使用者已報名的課程列表
router.get("/courses", isAuth, handleErrorAsync(userController.getUserBookingCourses))

module.exports = router
