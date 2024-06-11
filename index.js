const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const cors = require('cors')
const multer = require('multer');
const fs = require('fs')
const morgan = require('morgan');
const FormData = require('form-data');
const path = require('path')
const { createProxyMiddleware } = require('http-proxy-middleware');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

const API_URL = "https://api.dewatermark.ai/api"

const app = express()

const upload = multer({ dest: 'uploads/' });

//app.use(morgan('dev')); // Console logging
app.use(morgan('combined', { stream: accessLogStream }));
app.use('/', express.static('html'));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// Prevent cors error
app.use(cors())

app.get('/api/users/v1/userInfo', async function (req, res) {
  return res.json({
    "status": "OK",
    "data": {
        "user": {
            "user_id": "KIm3wECeaBMS5l0LPc9sbl2t4lo1",
            "email": "voloshchenkoruslan0@gmail.com"
        }
    }
})
  try {
    const { headers } = req
    const options = {
      method: 'GET',
      headers: {
        'content-type': 'application/json', 
        'X-Firebase-Token': headers['x-firebase-token'],
        authorization: headers['authorization'],
      },
      url: `${API_URL}/users/v1/userInfo`,
      timeout: 30000, // Adjust the timeout value as needed (in milliseconds)
    };
    const response = await axios(options)
    res.json(response.data)
  } catch(error) {
    console.log(error)
  }
})

app.post('/api/checkout/prices', async function(req, res) {
  const data = {
    "data": [
          {
              "id": "pri_01hymmfncf061k00b02tw34mhq",
              "product_id": "pro_01hymkz43gf1ve3m9mcr3nhp92",
              "type": "standard",
              "description": "Annual subscription",
              "name": null,
              "billing_cycle": {
                  "interval": "year",
                  "frequency": 1
              },
              "trial_period": null,
              "tax_mode": "account_setting",
              "unit_price": {
                  "amount": "4799",
                  "currency_code": "USD"
              },
              "unit_price_overrides": [],
              "custom_data": {
                  "service": "dewatermark"
              },
              "status": "active",
              "quantity": {
                  "minimum": 1,
                  "maximum": 1
              },
              "import_meta": null,
              "created_at": "2024-05-24T06:26:48.335873Z",
              "updated_at": "2024-05-24T07:18:01.373486Z"
          },
          {
              "id": "pri_01hymmbt74p2mb3f8kq83qx716",
              "product_id": "pro_01hymkz43gf1ve3m9mcr3nhp92",
              "type": "standard",
              "description": "Monthly subscription",
              "name": null,
              "billing_cycle": {
                  "interval": "month",
                  "frequency": 1
              },
              "trial_period": null,
              "tax_mode": "account_setting",
              "unit_price": {
                  "amount": "599",
                  "currency_code": "USD"
              },
              "unit_price_overrides": [],
              "custom_data": {
                  "service": "dewatermark"
              },
              "status": "active",
              "quantity": {
                  "minimum": 1,
                  "maximum": 1
              },
              "import_meta": null,
              "created_at": "2024-05-24T06:24:42.212203Z",
              "updated_at": "2024-05-24T06:24:42.212203Z"
          }
      ],
      "meta": {
          "request_id": "68f58dea-9a56-4dde-af45-3887ceea2285",
          "pagination": {
              "per_page": 50,
              "next": "https://api.paddle.com/prices?after=pri_01hymmbt74p2mb3f8kq83qx716&product_id=pro_01hymkz43gf1ve3m9mcr3nhp92",
              "has_more": false,
              "estimated_total": 2
          }
      }
  };

  try {
    const data = new FormData();
    data.append('product_id', 'pro_01hymkz43gf1ve3m9mcr3nhp92');

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.dewatermark.ai/api/checkout/prices',
      headers: { 
        'content-type': 'application/json', 
      },
      data : data,
      timeout: 30000, // Adjust the timeout value as needed (in milliseconds)
    };

    // const response = await axios.request(config)
    // res.json(response.data)
    res.json(data)
  } catch(error) {
    console.log(error)
  }

})

app.post('/api/object_removal/v5/erase_watermark', upload.fields([
  { name: 'original_preview_image', maxCount: 1 },
  { name: 'mask_base', maxCount: 1 }
  { name: 'mask_brush', maxCount: 1 }
]), async function(req, res) {
  try {
    const { headers } = req
    // Handle form data with image
    const uploadedFiles = req.files;
    const original_preview_image = uploadedFiles['original_preview_image'][0];
    const mask_base = uploadedFiles['mask_base'][0];
    const mask_brush = uploadedFiles['mask_brush'][0];
    try {
      const imageStream = fs.createReadStream(original_preview_image.path);

      // Send the form data with image to another site using Axios
      const formData = new FormData();
      formData.append('original_preview_image', imageStream);
      if(mask_base) {
        const mask_baseStream = fs.createReadStream(mask_base.path);
        formData.append('mask_base', mask_baseStream);
      }
      if(mask_brush) {
        const mask_brushStream = fs.createReadStream(mask_brush.path);
        formData.append('mask_brush', mask_brushStream);
      }
      if(!mask_base && !mask_brush) 
        formData.append('zoom_factor', 2);

      const options = {
        method: 'POST',
        headers: {
          ...formData.getHeaders(), 
          'X-Firebase-Token': headers['x-firebase-token'],
          authorization: headers['authorization'],
        },
        data: formData,
        url: `${API_URL}/object_removal/v5/erase_watermark`,
        timeout: 30000, // Adjust the timeout value as needed (in milliseconds)
      };
      const response = await axios(options)
      res.json(response.data)
    } catch (err) {
      console.error('Error reading file:', err);
      res.json(err);
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.listen(8000, '0.0.0.0', () => { console.log("server stared!") })