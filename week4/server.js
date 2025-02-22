require("dotenv").config()
const http = require("http")
const AppDataSource = require("./db")

function isUndefined (value) {
  return value === undefined
}

function isNotValidSting (value) {
  return typeof value !== "string" || value.trim().length === 0 || value === ""
}

function isNotValidInteger (value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0
}
// 設置 header
const headers = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
  "Content-Type": "application/json"
}
// 處理成功回應
function handleSuccessResponse(res, data=null) {
  res.writeHead(200, headers)
  let resData = {
    status: "success",
  }
  if (data) resData.data = data
  res.write(JSON.stringify(resData))
  res.end()
}
// 處理失敗回應
function handleErrorResponse(res, {statusCode, message}) {
  res.writeHead(statusCode, headers)
  let errorData = {}
  switch (statusCode) {
    case 500:
      errorData.status = "error"
      break;
    default:
      errorData.status = "failed"
      break;
  }
  errorData.message = message
  res.write(JSON.stringify(errorData))
  res.end()
}
// 處理 catch 回應
async function handleErrorAsync(req, res, callback=null) {
  try {
    if (callback && typeof callback === 'function') await callback()
  } catch (error) {
    console.error(error)
    handleErrorResponse(res, {
      statusCode: 500,
      message: "伺服器錯誤"
    })
  }
}

const requestListener = async (req, res) => {
  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })

  if (req.url === "/api/credit-package" && req.method === "GET") {
    handleErrorAsync(req, res, async ()=> {
      const packages = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"]
      })
      handleSuccessResponse(res, packages)
    })
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      handleErrorAsync(req, res, async ()=> {
        const data = JSON.parse(body)
        if (isUndefined(data.name) || isNotValidSting(data.name) ||
            isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount) ||
            isUndefined(data.price) || isNotValidInteger(data.price)) {
          handleErrorResponse(res, {
            statusCode: 400,
            message: "欄位未填寫正確"
          })
          return
        }
        const creditPackageRepo = await AppDataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
          where: {
            name: data.name
          }
        })
        if (existPackage.length > 0) {
          handleErrorResponse(res, {
            statusCode: 409,
            message: "資料重複"
          })
          return
        }
        const newPackage = await creditPackageRepo.create({
          name: data.name,
          credit_amount: data.credit_amount,
          price: data.price
        })
        const result = await creditPackageRepo.save(newPackage)
        handleSuccessResponse(res, result)
      })
    })
  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
    handleErrorAsync(req, res, async ()=> {
      const packageId = req.url.split("/").pop()
      if (isUndefined(packageId) || isNotValidSting(packageId)) {
        handleErrorResponse(res, {
          statusCode: 400,
          message: "ID錯誤"
        })
        return
      }
      const creditPackageRepo = await AppDataSource.getRepository("CreditPackage")
      const result = await creditPackageRepo.delete(packageId)
      if (result.affected === 0) {
        handleErrorResponse(res, {
          statusCode: 400,
          message: "ID錯誤"
        })
        return
      }
      handleSuccessResponse(res)
    })
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    handleErrorAsync(req, res, async ()=> {
      const skills = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name"]
      })
      handleSuccessResponse(res, skills)
    })
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () =>  {
      handleErrorAsync(req, res, async ()=> {
        const data = JSON.parse(body)
        if (isUndefined(data.name) || isNotValidSting(data.name)) {
          handleErrorResponse(res, {
            statusCode: 400,
            message: "欄位未填寫正確"
          })
          return 
        }
        const skillRepo = await AppDataSource.getRepository("Skill")
        const existSkill = await skillRepo.find({
          where: {
            name : data.name
          }
        })
        if (existSkill.length > 0) {
          handleErrorResponse(res, {
            statusCode: 409,
            message: "資料重複"
          })
          return
        }
        const newSkill = await skillRepo.create({
          name: data.name,
        })
        const result = await skillRepo.save(newSkill)
        handleSuccessResponse(res, result)
      })
    })
  } else if (req.url.startsWith("/api/coaches/skill/") && req.method === "DELETE") {
    handleErrorAsync(req, res, async ()=> {
      const skillId = req.url.split('/').pop()
      if (isUndefined(skillId) || isNotValidSting(skillId)) {
        handleErrorResponse(res, {
          statusCode: 400,
          message: "ID 錯誤"
        })
        return
      }
      const skillRepo = await AppDataSource.getRepository("Skill")
      const result = await skillRepo.delete(skillId)
      if (result.affected === 0) {
        handleErrorResponse(res, {
          statusCode: 400,
          message: "ID 錯誤"
        })
        return
      }
      handleSuccessResponse(res)
    })
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers)
    res.end()
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      status: "failed",
      message: "無此網站路由"
    }))
    res.end()
  }
}

const server = http.createServer(requestListener)

async function startServer () {
  await AppDataSource.initialize()
  console.log("資料庫連接成功")
  server.listen(process.env.PORT)
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`)
  return server;
}

module.exports = startServer();
