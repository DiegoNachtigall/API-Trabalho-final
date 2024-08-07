import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.get("/", async (req, res) => {

    const usuarios = await prisma.usuario.findMany()
    res.status(200).json(usuarios)

})

function validaSenha(senha: string) {

  const mensa: string[] = []

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0 || grandes == 0 || numeros == 0 || simbolos == 0) {
    mensa.push("Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos")
  }

  return mensa
}

router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" })
    return
  }

  const erros = validaSenha(senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  // verifica se o email já está cadastrado
  const usuarioCadastrado = await prisma.usuario.findFirst({
    where: { email }
  })

  if (usuarioCadastrado) {
    res.status(400).json({ erro: "E-mail já cadastrado" })
    return
  }


  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(senha, salt)

  // para o campo senha, atribui o hash gerado
  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash }
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Efetua o Desbloqueio de um Usuário
router.put("/desbloquear/:id", async (req, res) => {
  const { id } = req.params

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { blocked: false, tentativasLogin: 0 }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Efetua a mudança de senha de um usuário
router.put("/mudarsenha/:id", async (req, res) => {
  const { id } = req.params
  const { senhaAntiga, senhaNova } = req.body

  if (!senhaAntiga || !senhaNova) {
    res.status(400).json({ erro: "Informe a senha antiga e a nova senha" })
    return
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: Number(id) }
  })

  if (!usuario) {
    res.status(400).json({ erro: "Usuário não encontrado" })
    return
  }

  if (!bcrypt.compareSync(senhaAntiga, usuario.senha)) {
    res.status(400).json({ erro: "Senha antiga inválida" })
    return
  }

  const erros = validaSenha(senhaNova)

  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const hash = bcrypt.hashSync(senhaNova, 12)

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { senha: hash }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }

})
export default router