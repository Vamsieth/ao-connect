import axios from "axios"
import express, { json } from "express"
import { connect, results } from "@permaweb/aoconnect"
import { readFileSync } from "fs"
import { createDataItemSigner } from "@permaweb/aoconnect"
import dotenv from "dotenv"
import OpenAI from "openai"
import fs from "fs"
import multer from "multer"
const upload = multer({ dest: "uploads/" })

import { v2 as cloudinary } from "cloudinary"

const app = express()

app.use(express.json())
dotenv.config()

cloudinary.config({
  cloud_name: "dcmninsrn",
  api_key: process.env.PIC_API,
  api_secret: process.env.PIC_SECRET,
})
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" })
    }

    const result = await cloudinary.uploader.upload(req.file.path)

    res.json({
      image: result.secure_url,
      public_id: result.public_id,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurred" })
  }
})

app.get("/display/:public_id", async (req, res) => {
  try {
    const { public_id } = req.params
    const result = cloudinary.url(public_id, {
      width: 500,
      height: 500,
      crop: "fill",
    })

    res.json({ image: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurred" })
  }
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Connect to AO
const ao = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz",
  GATEWAY_URL: "https://arweave.net",
})

// Destructure required functions from ao
const { message } = ao

// Read wallet file

const wallet = fs.readFileSync("./testWallet.json").toString()
const signer = createDataItemSigner(JSON.parse(wallet))

app.get("/join", async (req, res) => {
  const id = req.query

  try {
    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Register" }],
      signer: signer,
      data: "testtt",
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API endpoint to send message
app.post("/send-message", async (req, res) => {
  const msg = req.body.msg
  try {
    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: msg,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

//API for fetching News
app.get("/gpt", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say a random fact about web 3 or crypto or blockchain",
        },
      ],
      temperature: 1,
      max_tokens: 90,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const msg = response.choices[0].message.content

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: JSON.stringify(msg),
    })
    console.log(result) //messageId

    res.json(msg)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/askgpt", async (req, res) => {
  const query = req.body.query

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You're a helpful assistant, answer what the user asks you",
        },
        {
          role: "user",
          content: `${query}`,
        },
      ],
      temperature: 1,
      max_tokens: 90,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const msg = response.choices[0].message.content

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: JSON.stringify(msg),
    })
    res.json({ msg })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const NEWS_API_URL = "https://newsapi.org/v2/everything"

app.post("/news", async (req, res) => {
  try {
    const keyword = req.body.keyword || "Crypto"
    const response = await axios.get(
      `${NEWS_API_URL}?q=${keyword}&from=2024-03-28&sortBy=popularity`,
      {
        headers: {
          "X-Api-Key": process.env.NEWS_API_KEY,
        },
      }
    )

    if (response.data && response.data.articles) {
      const news = response.data.articles.map((data) => data.title)
      console.log(news)

      const result = await message({
        process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
        tags: [{ name: "Action", value: "Broadcast" }],
        signer: signer,
        data: JSON.stringify(news),
      })

      console.log(result) //MessageId
      res.json(news)
    } else {
      console.error("Invalid API response:", response.data)
      res.status(500).json({ error: "An error occurred" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "An error occurred" })
  }
})

app.get("/test", async (req, res) => {
  try {
    const msg = [
      {
        hi: "hello",
        vamsi: "AP",
      },
      {
        aritra: "Chennai",
      },
    ]

    const result = await message({
      process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
      tags: [{ name: "Action", value: "Broadcast" }],
      signer: signer,
      data: "Inbox",
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/price", async (req, res) => {
  let response = null
  new Promise(async (resolve, reject) => {
    try {
      response = await axios.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
        {
          headers: {
            "X-CMC_PRO_API_KEY": process.env.PRICE_API,
          },
        }
      )
      if (response) {
        // success
        const json = response.data
        const data = json.data.map((price) => ({ name: price.name, price: price.quote.USD.price }))
        const topPrice = data.slice(0, 10)
        const result = await message({
          process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
          tags: [{ name: "Action", value: "Broadcast" }],
          signer: signer,
          data: JSON.stringify(topPrice),
        })
        resolve(json)
        res.json(topPrice)
      }
    } catch (ex) {
      response = null
      // error
      console.log(ex)
      reject(ex)
    }
  })
})

app.get("/receive", async (req, res) => {
  let resultsOut = await results({
    process: "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g",
    sort: "DESC",
  })
  // resultsOut.edges.map((node) => {
  //   data.push(node.node);
  // })
  let msgList = []
  resultsOut.edges.map((msg) => {
    msgList.push(msg.node.Messages)
  })
  let resList = []
  msgList.map((msg) => {
    // console.log(msg)
    // resList.push(msg)
    msg.map((lol) => {
      resList.push(lol)
    })
  })
  const finalRes = []
  resList = resList.filter((data) => (data.Target = "llyqIaAuCOF9x3d_GW67Kox8TZOt3sfQsReyTYtjP0g"))
  resList.map((data) => {
    finalRes.push(data.Data)
    // console.log()
  })

  return res.json(finalRes)
})

app.get("/all", (req, res) => {
  const endpoints = [
    {
      endpoint: "/upload",
      method: "POST",
      description: "Uploads an image to Cloudinary",
    },
    {
      endpoint: "/display/:public_id",
      method: "GET",
      description: "Displays an image from Cloudinary",
    },
    {
      endpoint: "/join",
      method: "GET",
      description: "Joins a process",
    },
    {
      endpoint: "/send-message",
      method: "POST",
      description: "Sends a message",
    },
    {
      endpoint: "/gpt",
      method: "GET",
      description:
        "Generates a random fact about web 3 or crypto or blockchain using OpenAI GPT-3.5",
    },
    {
      endpoint: "/askgpt",
      method: "POST",
      description: "Asks a question to OpenAI GPT-3.5",
    },
    {
      endpoint: "/news",
      method: "POST",
      description: "Fetches news articles related to a keyword",
    },
    {
      endpoint: "/test",
      method: "GET",
      description: "Test endpoint",
    },
    {
      endpoint: "/price",
      method: "POST",
      description: "Fetches top 10 cryptocurrency prices",
    },
    {
      endpoint: "/receive",
      method: "GET",
      description: "Lists all available messages in chatroom",
    },
    {
      endpoint: "/all",
      method: "GET",
      description: "Lists all available endpoints with descriptions",
    },
  ]

  res.json(endpoints)
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
