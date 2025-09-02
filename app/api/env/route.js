/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
 
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { loadEnvironment } = require('../../../lib/env-loader');
    const envData = loadEnvironment();
    
    // Filter out sensitive variables - only return public ones
    const publicVars = {};
    Object.keys(envData.vars).forEach(key => {
      // Only expose variables that start with NEXT_PUBLIC_
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicVars[key] = envData.vars[key];
      }
    });
    
    return NextResponse.json({
      file: envData.file,
      vars: publicVars
    });
  } catch (error) {
    console.error('Error loading environment:', error);
    return NextResponse.json(
      { error: 'Failed to load environment' },
      { status: 500 }
    );
  }
}