const jwt = require('jsonwebtoken');

function generateAccessToken(data, options={ expiresIn: '1800s' }) {
    return jwt.sign(data, process.env.SECRET_KEY, options);
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    // Autorization Bearer: token
    // 0 => "Bearer:"
    // 1 => "token"
    if (token == null) {
        return res.sendStatus(401); // 401 Unauthorized.
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, data) => {
        console.log(err);

        if (err) return res.sendStatus(403); // 403 Forbidden.

        req.accessToken = data;

        next();
    });
}

// let texto = "comecou a execução"
// let dados = texto.split('e')
// dados = ['com', 'cou ', 'a', 'x', 'cução']

module.exports = { generateAccessToken, authenticateToken }