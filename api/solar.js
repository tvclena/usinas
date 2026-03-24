import axios from "axios"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

function md5(text){
  return crypto.createHash("md5").update(text).digest("hex")
}

export default async function handler(req, res){

  try {

    // 🔐 LOGIN ISOLARCLOUD
    const login = await axios.post(
      "https://gateway.isolarcloud.com/openapi/user/login",
      {
        userName: process.env.SOLAR_USER,
        password: md5(process.env.SOLAR_PASS)
      }
    )

    const token = login.data.result.token

    // ⚡ DADOS TEMPO REAL
    const dados = await axios.post(
      "https://gateway.isolarcloud.com/openapi/plant/getRealTimeData",
      {
        plantId: process.env.PLANT_ID
      },
      {
        headers: { token }
      }
    )

    const energia = dados.data.result

    const registro = {
      empresa: "MERCATTO DELICIA",
      plant_id: process.env.PLANT_ID,
      geracao_kw: energia.power || 0,
      consumo_kw: energia.loadPower || 0,
      status: energia.deviceStatus || "OK"
    }

    // 💾 SALVA NO SUPABASE
    await supabase
      .from("energia_solar")
      .insert(registro)

    return res.json(registro)

  } catch (err) {
    return res.status(500).json({
      erro: err.message
    })
  }
}
