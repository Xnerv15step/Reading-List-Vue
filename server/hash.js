const bcrypt = require('bcryptjs')

async function main() {
  const hash = await bcrypt.hash('test1234', 10)
  console.log(hash)
}

main()