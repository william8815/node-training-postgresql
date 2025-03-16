const { dataSource } = require("../db/data-source")
const appError = require("../utils/appError")
const logger = require("../utils/logger")("CreditPackageController")
const { isUndefined, isNotValidInteger, isNotValidSting } = require("../utils/validUtils")

const creditPackageController = {
    async getCreditPackages(req, res, next) {
        const packages = await dataSource.getRepository("CreditPackage").find({
            select: ["id", "name", "credit_amount", "price"]
        })
        res.status(200).json({
            status: "success",
            data: packages
        })
    },
    async postCreditPackage(req, res, next) {
        const { name, credit_amount, price } = req.body
        if (isUndefined(name) || isNotValidSting(name) ||
            isUndefined(credit_amount) || isNotValidInteger(credit_amount) ||
            isUndefined(price) || isNotValidInteger(price)) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位未填寫正確"))
            return
        }
        const creditPackageRepo = dataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
            where: {
                name: name
            }
        })
        if (existPackage.length > 0) {
            logger.warn("資料重複")
            next(appError(409, "資料重複"))
            return
        }
        const newPackage = creditPackageRepo.create({
            name: name,
            credit_amount: credit_amount,
            price: price
        })
        const result = await creditPackageRepo.save(newPackage)
        res.status(200).json({
            status: "success",
            data: result
        })
    },
    async deleteCreditPackage(req, res, next) {
        const { creditPackageId } = req.params
        if (isUndefined(creditPackageId) || isNotValidSting(creditPackageId)) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        const creditPackageRepo = dataSource.getRepository("CreditPackage")
        const result = await creditPackageRepo.delete(creditPackageId)
        if (result.affected === 0) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        res.status(200).json({
            status: "success",
        })
    },
    async buyCreditPackage(req, res, next) {
        const { id } = req.user
        const { creditPackageId } = req.params
        if (isUndefined(creditPackageId) || isNotValidSting(creditPackageId)) {
            next(appError(400, "欄位輸入錯誤"))
            return
        }
        const creditPackageRepo = dataSource.getRepository("CreditPackage")
        const existCreditPackage = await creditPackageRepo.findOne({
            where: {id : creditPackageId}
        })
        if (!existCreditPackage) {
            logger.warn('ID錯誤')
            next(appError(400, "ID錯誤"))
            return
        }
        const creditPurchaseRepo = dataSource.getRepository("CreditPurchase")
        const newPurchase = await creditPurchaseRepo.create({
            user_id : id,
            credit_package_id : creditPackageId,
            purchased_credits : existCreditPackage.credit_amount,
            price_paid: existCreditPackage.price,
            purchaseAt: new Date().toISOString()
        })
        await creditPurchaseRepo.save(newPurchase)
        res.status(201).json({
            status: "success",
            data: null
        })
    }
}
module.exports = creditPackageController