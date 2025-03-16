// 自定義錯誤工具：回傳設定好的 Error 實例
const appError = (status, errMessage, next) => {
    const error = new Error(errMessage)
    error.status = status
    return error
}

module.exports = appError