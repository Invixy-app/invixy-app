import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Start a transaction to delete all related data
    await db.$transaction(async (tx) => {
      // 1. Handle Businesses
      // Find all businesses where the user is an OWNER
      const ownedBusinesses = await tx.businessUserRole.findMany({
        where: {
          userId,
          role: 'OWNER'
        },
        include: {
          business: {
            include: {
              BusinessUserRole: {
                where: {
                  role: 'OWNER'
                }
              }
            }
          }
        }
      });

      for (const role of ownedBusinesses) {
        const business = role.business;
        const ownerCount = business.BusinessUserRole.length;

        if (ownerCount === 1) {
          // User is the sole owner, delete the business (cascades to invoices, products, etc.)
          await tx.business.delete({
            where: { id: business.id }
          });
        }
        // If there are other owners, the business remains.
        // The user's role will be deleted when the user is deleted (cascade).
      }

      // 2. Delete the user
      // This will cascade delete:
      // - Account
      // - Session
      // - BusinessUserRole
      // - UserSettings
      // And set to null (via schema change):
      // - Invoice.createdBy
      // - Payment.createdBy
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error("[USER_ACCOUNT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}