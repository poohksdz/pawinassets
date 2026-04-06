const bcrypt = require('bcryptjs');

async function test() {
    try {
        const password = 'password';
        const hash = await bcrypt.hash(password, 10);
        console.log('Hash generated:', hash);
        const match = await bcrypt.compare(password, hash);
        console.log('Match:', match);
    } catch (err) {
        console.error('Bcrypt Error:', err);
    }
}

test();
