const { Prisma } = require('@prisma/client');
const fs = require('fs');
const mime = require('mimetype');

function exceptionHandler(e, response) {
    console.log(e);
    // Resposta de exceções padrão.
    let error = {
      code: 500,
      message: "Internal Server Error"
    }
    // Resposta exceções dos prisma, relacionadas ao client.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientValidationError
    ) {
      error.code = 400;
      error.message = e.message;
    }
    // Resposta ao client.
    response.status(error.code).json({
      error: error.message,
    });
}

fileHandler = async (req, data) => {
  const baseUrl = `${req.protocol}://${req.headers.host}`; // http://127.0.0.1:5000
  if ('image' in data && data.image !== null) {
    // Imagem pública.
    imageData = `${baseUrl}/${data.image}`; // http://127.0.0.1:5000 /uploads/nome_image.png
    if(fs.existsSync(`private/${data.image}`)) {
      // Imagem privada.
      imageData = await dataUriFromFile(`private/${data.image}`);
    }
    return imageData;
  }
  return null;
}

dataUriFromFile = async (filepath) => {

  // Lê o arquivo em formato binário.
  const binaryData = fs.readFileSync(filepath);
  // Converte arquivo para do buffer para base64.
  const base64String = Buffer.from(binaryData).toString('base64');
  // Obtem o mime type.
  const mimeType = mime.lookup(filepath);
  // Formata a data URI.
  const dataUri = `data:${mimeType};base64,${base64String}`;
  // console.log(dataUri);

  return dataUri;
}

module.exports = { exceptionHandler, fileHandler };