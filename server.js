const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🏥 Iconic Chatbot - ¡Funcionando desde cero!");
});

app.listen(PORT, () => {
  console.log("✅ Servidor listo en: http://localhost:" + PORT);
});