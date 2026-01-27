import prisma from "@/lib/db";
import { businessSchema } from "@/lib/validations/business";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { checkBusinessLimit } from "@/lib/subscription";


export async function POST(req: Request) {
    try {
        const session = await requireAuth();
        const body=await req.json();
        const parsedBody=businessSchema.safeParse(body);
        if(!parsedBody.success){
            return NextResponse.json({errors:parsedBody.error.flatten()},{status:400});
        }

        const user=await prisma.user.findUnique({where:{email:session.user.email}});
        if(!user){
            return NextResponse.json({error:"User not found!"},{status:404});
        }

        const limitCheck = await checkBusinessLimit(user.id);
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }

       //adding business
       const business=await prisma.business.create({
        data:{
            name:parsedBody.data.name,
            description:parsedBody.data.description,
            billingAddress:parsedBody.data.billingAddress,
            shippingAddress:parsedBody.data.shippingAddress,
            taxRegistrationNumber:parsedBody.data.taxRegistrationNumber,
            phone:parsedBody.data.phone,
            email:parsedBody.data.email,
            website:parsedBody.data.website,
            currency:parsedBody.data.currency || "USD",
            timezone:parsedBody.data.timezone || "UTC",
            logo:parsedBody.data.logo,
            isActive:parsedBody.data.isActive ?? true,
            createdAt:new Date(),
            updatedAt:new Date(),
            
       }
    });
         //linking user to business with role as admin
         await prisma.businessUserRole.create({
            data:{
                userId:user.id,
                businessId:business.id,
                role:"OWNER"
            }
         })

        return NextResponse.json({message:"Business created successfully!"},{status:201});
    }catch(err:any){
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}


export async function GET(req: Request) {
    try {
        const session = await requireAuth();
        
        const user=await prisma.user.findUnique({
            where:{email:session.user.email},
            include:{BusinessUserRole:{
                include:{
                    business:{
                        include: {
                            subscriptions: {
                                where: { status: "ACTIVE" },
                                orderBy: { createdAt: "desc" },
                                take: 1
                            }
                        }
                    }
                }
            }}
        });
        if(!user){
            return NextResponse.json({error:"User not found!"},{status:404});
        }

        const businesses=user.BusinessUserRole.map((bur)=>({
            id:bur.business.id,
            name:bur.business.name,
            description:bur.business.description,
            billingAddress:bur.business.billingAddress,
            shippingAddress:bur.business.shippingAddress,
            taxRegistrationNumber:bur.business.taxRegistrationNumber,
            phone:bur.business.phone,
            email:bur.business.email,
            website:bur.business.website,
            currency:bur.business.currency,
            role:bur.role,
            plan: bur.business.subscriptions[0]?.plan || "FREE",
            createdAt:bur.business.createdAt,
            updatedAt:bur.business.updatedAt
        }));

        return NextResponse.json({businesses},{status:200});
    }catch(err:any){
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}