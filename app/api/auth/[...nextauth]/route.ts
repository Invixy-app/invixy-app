import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";

const handler=NextAuth({
    adapter:PrismaAdapter(prisma),
    session:{strategy:"jwt"},
    providers:[
        CredentialsProvider({
            name:"Credentials",
            credentials:{
                email:{label:"Email",type:"text"},
                password:{label:"Password",type:"password"}
            },
            async authorize(credentials){
                if(!credentials?.email || !credentials?.password){
                    return null;
                }
                const user =await prisma.user.findUnique({  
                    where:{email:credentials.email}
                });
                if(!user || user.password!==credentials.password){
                    return null;
                }
                const isValid=await bcrypt.compare(credentials.password,user.password);
                if(!isValid){
                    return null;
                }
                return user;
            }
        })
    ],
    pages:{
        signIn:"/auth/login",
        error:"/auth/error"
    }
})

export {handler as GET,handler as POST};