const express = require('express')
const bodyParser = require('body-parser')
const opencv = require('opencv')
const cors = require('cors')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const app = express()

app
  .use(cors())
  .use(fileUpload())
  .use('/files', express.static('files'))
  .use(bodyParser.urlencoded({ extended: true }))

app
  .get('/api/process', (req, res) => {
    res.json({
      status: 'ok',
    })
  })
  .post('/upload', (req, res) => {
    if (!req.files) return res.status(400).send('No files were uploaded.')

    const { name, mimetype, md5, mv } = req.files.file;
    const filesPath = path.join(__dirname, 'files')
    const fileExt = mimetype.match(/(png|jpg|jpeg)/g)[0]
    const fileName = `${md5}.${fileExt}`
    const absolutePath = path.join(filesPath, fileName)

    if (!fs.existsSync(absolutePath)) {
      console.log('uploaded new file!');

      mv(absolutePath, function (err) {
        if (err) return res.status(500).send(err)
      })
    }

    return res.status(200).json({
      fileId: md5,
      fileName,
      fileExt
    })
  })

app.listen(9999)
