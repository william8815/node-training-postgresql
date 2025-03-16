const express = require('express')
const router = express.Router()

const isAuth = require('../middlewares/isAuth')
const handleErrorAsync = require('../utils/handleErrorAsync')
const uploadController = require('../controllers/upload')
// POST : 上傳圖片
router.post('/', isAuth, handleErrorAsync(uploadController.uploadImage))

module.exports = router