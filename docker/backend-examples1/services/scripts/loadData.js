const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({errorFormat: "minimal"});
const bcrypt = require('bcryptjs');

async function offeringData() {
    const offeringItemCount = await prisma.offering.count();

    if (offeringItemCount === 0) {
      const offeringItems = [
        {
          name: "Margherita",
          description: "Molho de tomate, mussarela, manjericão, azeite",
          price: 25.99,
          image: "https://foodish-api.com/images/pizza/pizza51.jpg",
          enabled: true,
          featured: true,
        },
        {
          name: "Pepperoni",
          description: "Molho de tomate, mussarela, pepperoni",
          price: 29.99,
          image: "https://foodish-api.com/images/pizza/pizza94.jpg",
          enabled: true,
          featured: true,
        },
        {
          name: "Quatro Queijos",
          description: "Molho de tomate, quatro queijos",
          price: 32.99,
          image: "https://foodish-api.com/images/pizza/pizza89.jpg",
          enabled: true,
          featured: false,
        },
        {
          name: "Frango com Catupiry",
          description: "Molho de tomate, frango desfiado, catupiry",
          price: 34.99,
          image: "https://foodish-api.com/images/pizza/pizza22.jpg",
          enabled: true,
          featured: false,
        },
        {
          name: "Calabresa",
          description: "Molho de tomate, mussarela, calabresa fatiada",
          price: 28.99,
          image: "https://foodish-api.com/images/pizza/pizza66.jpg",
          enabled: true,
          featured: true,
        },
        {
          name: "Portuguesa",
          description: "Molho de tomate, presunto, ovos, cebola, azeitonas",
          price: 30.99,
          image: "https://foodish-api.com/images/pizza/pizza74.jpg",
          enabled: false,
          featured: false,
        },
        {
          name: "Vegetariana",
          description: "Molho de tomate, cogumelos, abobrinha, pimentão",
          price: 27.99,
          image: "https://foodish-api.com/images/pizza/pizza77.jpg",
          enabled: true,
          featured: false,
        },
        {
          name: "Almôndegas",
          description: "Molho de tomate, mussarela, almôndegas",
          price: 22.99,
          image: "https://foodish-api.com/images/pizza/pizza79.jpg",
          enabled: true,
          featured: true,
        },
        {
          name: "Palmito",
          description: "Molho de tomate, mussarela, palmito",
          price: 31.99,
          image: "https://foodish-api.com/images/pizza/pizza94.jpg",
          enabled: false,
          featured: false,
        },
        {
          name: "Carbonara",
          description: "Molho de tomate, bacon, ovos, queijo parmesão",
          price: 35.99,
          image: "https://foodish-api.com/images/pizza/pizza81.jpg",
          enabled: true,
          featured: false,
        }
      ];

      await prisma.offering.createMany({
        data: offeringItems,
      });

      console.log('Ofertas criadas com sucesso!');
    } else {
      console.log('A tabela de ofertas já contém registros.');
    }
}

offeringData();

async function userData() {
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    const password = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: "admin@example.com",
        name:  "Usuário Administrador",
        password,
        is_admin: true
      },
    });

    console.log('\nUsuario admin@example.com criado com sucesso! Senha: admin123 - para alterar PATCH /api/users/{id}');
    console.log('Para alterar a senha POST /api/users/login e depois PATCH /api/users/{id}');
  } else {
    console.log('A tabela de users já contém registros.');
  }
}

userData();