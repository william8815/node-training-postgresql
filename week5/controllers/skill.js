const { dataSource } = require("../db/data-source")
const appError = require("../utils/appError")
const logger = require('../utils/logger')('SkillController')
const { isUndefined, isNotValidSting } = require("../utils/validUtils")

const skillController = {
    async getSkills(req,res,next) {
        const skills = await dataSource.getRepository("Skill").find({
            select: ["id", "name"]
        })
        res.status(200).json({
            status: "success",
            data: skills
        })
    },
    async postSkill(req, res, next) {
        const { name } = req.body
        if (isUndefined(name) || isNotValidSting(name)) {
            logger.warn("欄位未填寫正確")
            next(appError(400, "欄位未填寫正確"))
            return
        }
        const skillRepo = dataSource.getRepository("Skill")
        const existSkill = await skillRepo.find({
            where: {
                name: name
            }
        })
        if (existSkill.length > 0) {
            logger.warn("資料重複")
            next(appError(409, "資料重複"))
            return
        }
        const newSkill = skillRepo.create({
            name: name,
        })
        const result = await skillRepo.save(newSkill)
        res.status(200).json({
            status: "success",
            data: result
        })
    },
    async deleteSkill(req, res, next) {
        const { skillId } = req.params
        if (isUndefined(skillId) || isNotValidSting(skillId)) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        const skillRepo = dataSource.getRepository("Skill")
        const result = await skillRepo.delete(skillId)
        if (result.affected === 0) {
            logger.warn("ID錯誤")
            next(appError(400, "ID錯誤"))
            return
        }
        res.status(200).json({
            status: "success",
        })
    }
}

module.exports = skillController