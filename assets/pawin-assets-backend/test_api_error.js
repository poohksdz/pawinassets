const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/users/login', {
            email: 'admin@pawin.com',
            password: 'password'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.log('Status:', err.response?.status);
        console.log('Headers:', JSON.stringify(err.response?.headers, null, 2));
        console.log('Data:', JSON.stringify(err.response?.data, null, 2));
    }
}

test();
