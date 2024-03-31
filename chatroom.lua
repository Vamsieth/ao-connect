local http = require("socket.http")
local json = require("json")
local ltn12 = require("ltn12")

local apiKey = ""
local apiUrl = "https://jsonplaceholder.typicode.com/todos/1" .. apiKey


Members = Members or {}

Handlers.add(
  "Register",
  Handlers.utils.hasMatchingTag("Action", "Register"),
  function (msg)
    local memberExists = false
    for _, member in ipairs(Members) do
      if member == msg.From then
        memberExists = true
        break
      end
    end

    if not memberExists then
      table.insert(Members, msg.From)
      Handlers.utils.reply("registered")(msg)
    else
      Handlers.utils.reply("Already registered")(msg)
    end
  end
)

Handlers.add(
  "Broadcast",
  Handlers.utils.hasMatchingTag("Action", "Broadcast"),
  function (msg)
    for _, recipient in ipairs(Members) do
      ao.send({Target = recipient, Data = msg.Data})
    end
    Handlers.utils.reply("Broadcasted.")(msg)
  end
)

Handlers.add(
  "News",
  Handlers.utils.hasMatchingTag("Action", "News"),
  function (msg)
    local news = getNews()
    for _, recipient in ipairs(Members) do
      ao.send({Target = recipient, Data = news})
    end
    Handlers.utils.reply("Broadcasted.")(msg)
  end
)