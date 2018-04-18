const express = require('express')
const bodyParser = require('body-parser')
const cv = require('opencv')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const md5File = require('md5-file')
const fileUpload = require('express-fileupload')
const sleep = require('sleep')
const app = express()

const filesPath = path.join(__dirname, 'upload_files')

app
  .use(cors())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .use(fileUpload())
  .use('/files', express.static('files'))

app
  .post('/api/process', async (req, res) => {
    if (Object.keys(req.body).length) {
      const { id, type, settings, files: { fileId, fileExt } } = req.body
      const fileName = `${fileId}.${fileExt}`
      const file = path.join(filesPath, fileName)
      const outFile = path.join(filesPath, `temp_process.${fileExt}`)

      if (fileName.length == 0) {
        res.json({ status: 1 })
        return
      }

      if (!fs.existsSync(file)) {
        res.json({ status: 1 })
        return
      }

      // NOTE: function stream process
      await cv.readImage(file, (err, im) => {
        try {
          sleep.msleep(500)

          if (err) {
            res.json({ status: 1 })
            return
          }
          if (type === 'ResizeFunction') {
            const { widthPercent, heightPercent } = settings
            const [height, width] = im.size()
            const computedWidthSize = widthPercent > 0 ? width * widthPercent / 100 : width
            const computedHeightSize = heightPercent > 0 ? height * heightPercent / 100 : height
            im.resize(width + computedWidthSize, height + computedHeightSize)
          } else if (type === 'GaussianBlurFunction') {
            const { sigma } = settings
            im.gaussianBlur([sigma, sigma])
          } else if (type === 'RotateFunction') {
            const { angle } = settings
            im.rotate(angle)
          } else if (type === 'ConvertGrayScaleFunction') {
            im.convertGrayscale()
          } else if (type === 'ConvertHSVscale') {
            im.convertHSVscale()
          }

          im.save(outFile)

          const hash = md5File.sync(outFile)
          const newFileName = `${hash}.${fileExt}`
          const newFile = path.join(filesPath, newFileName)
          fs.renameSync(outFile, newFile)

          res.json({
            fileId: hash,
            fileExt
          })
        }
        catch (error) {
          res.json({
            status: 1
          })
        }
      })

      return
    }

    res.json({ status: 1 })
  })

  .post('/upload', (req, res) => {
    if (!req.files) return res
      .status(400)
      .json({ status: 1 })

    const { name, mimetype, md5, mv } = req.files.file;
    const fileExt = mimetype.match(/(png|jpg|jpeg)/g)[0]
    const fileName = `${md5}.${fileExt}`
    const absolutePath = path.join(filesPath, fileName)

    if (!fs.existsSync(absolutePath)) {
      console.log('uploaded new file!');

      mv(absolutePath, function (err) {
        if (err) return res
          .status(500)
          .json({
            status: 1
          })
      })
    }

    return res
      .status(200)
      .json({
        fileId: md5,
        fileExt
      })
  })

app.listen(9999)
