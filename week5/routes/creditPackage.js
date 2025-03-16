const express = require('express')
const router = express.Router()
const handleErrorAsync = require('../utils/handleErrorAsync')
const isAuth = require('../middlewares/isAuth')
const creditPackageController = require('../controllers/creditPackage')
// 取得課程方案
router.get('/', handleErrorAsync(creditPackageController.getCreditPackages))
// 新增課程方案
router.post('/', handleErrorAsync(creditPackageController.postCreditPackage))
// 刪除課程方案
router.delete('/:creditPackageId', handleErrorAsync(creditPackageController.deleteCreditPackage))
// 購買課程方案
router.post("/:creditPackageId", isAuth ,handleErrorAsync(creditPackageController.buyCreditPackage))

module.exports = router
