const jwt = require('jsonwebtoken');

function generateAccessToken(user){
    jwt.sign(
    {
        name: user.name,
        email: user.email,
        role: user.role
    },
    process.env.SECRET_REFRESH_TOKEN,
    { expiresIn: '1d' }
)
}

const refreshToken = jwt.sign(
    {
        email: user.email,
    },
    process.env.SECRET_REFRESH_TOKEN,
    { expiresIn: '1d' }
)

res.cookie('jwt', refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    maxAge: 1 * 24 * 60 * 60
})

res.json({accessToken})

module.exports = {
    generateAccessToken,
    generateAccessToken
}