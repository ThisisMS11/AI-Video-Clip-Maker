import { NextResponse } from 'next/server';

export const makeResponse = (
    statusCode: number,
    success: boolean,
    message: string | undefined,
    data: any
) => {
    return NextResponse.json(
        {
            success,
            message,
            data,
        },
        {
            status: statusCode,
        }
    );
};