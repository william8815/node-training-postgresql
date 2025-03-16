// 檔案上傳邏輯
const formidable = require('formidable')
const logger = require('../utils/logger')('UploadController')
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = {
    'image/jpeg': true,
    'image/png': true
}

// firebase
const firebaseAdmin = require('firebase-admin')
const config = require('../config/index')
// 初始化
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(config.get('secret.firebase.serviceAccount')),
    storageBucket: config.get('secret.firebase.storageBucket')
})
const bucket = firebaseAdmin.storage().bucket()

const uploadController = {
    async uploadImage(req, res, next) {
        // formidable 設定
        const form = formidable.formidable({
            multiple: false,
            maxFileSize: MAX_FILE_SIZE,
            filter: ({ mimetype }) => {
                return !!ALLOWED_FILE_TYPES[mimetype]
            }
        })

        // 解析上傳檔案
        const [fields, files] = await form.parse(req)
        logger.info('files')
        logger.info(files)
        logger.info('fields')
        logger.info(fields)
        const filePath = files.file[0].filepath
        const remoteFilePath = `images/${new Date().toISOString()}-${files.file[0].originalFilename}`
        await bucket.upload(filePath, { destination: remoteFilePath })
        // 檔案簽章設定
        const options = {
            action: 'read', // 權限 (讀取...)
            expires: Date.now() + 24 * 60 * 60 * 1000 // 過期時間
        }
        const [imageUrl] = await bucket.file(remoteFilePath).getSignedUrl(options)
        logger.info(imageUrl)
        res.status(200).json({
            status: 'success',
            data: {
                image_url: imageUrl
            }
        })
    }
}

module.exports = uploadController