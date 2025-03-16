const express = require('express')
const router = express.Router()
const handleErrorAsync = require('../utils/handleErrorAsync')
const coachesController = require("../controllers/coaches")

// GET : 取得教練清單
router.get("/", handleErrorAsync(coachesController.getCoaches))
// GET : 取得教練詳細資訊
router.get("/:coachId", handleErrorAsync(coachesController.getOneCoach))

module.exports = router