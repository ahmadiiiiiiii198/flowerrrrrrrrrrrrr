import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testBusinessHoursValidation() {
  console.log('🧪 TESTING BUSINESS HOURS VALIDATION - FRIDAY CHECK');
  console.log('===================================================');
  
  try {
    // Get business hours from database
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'businessHours')
      .single();

    if (error) {
      console.log('❌ Error fetching business hours:', error.message);
      return;
    }

    const hours = data.value;
    console.log('📋 Business hours from database:');
    console.log(JSON.stringify(hours, null, 2));
    
    // Check current day and time
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    console.log('');
    console.log('🗓️ Current day:', currentDay.toUpperCase(), '(index:', dayOfWeek, ')');
    console.log('🕒 Current time:', currentTime);
    console.log('📅 Today is Friday?', currentDay === 'friday' ? 'YES ✅' : 'NO ❌');
    
    // Get today's hours
    const todayHours = hours[currentDay];
    console.log('🕐 Today\'s hours setting:', JSON.stringify(todayHours));
    
    // Check if business is open today
    if (!todayHours.isOpen) {
      console.log('❌ Business is set to CLOSED today');
      console.log('🚨 PROBLEM: Today is marked as closed in database');
      return;
    }
    
    console.log('✅ Business is set to OPEN today');
    console.log('⏰ Hours:', todayHours.openTime, '-', todayHours.closeTime);
    
    // Check if current time is within business hours
    const isWithinHours = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
    
    console.log('');
    console.log('🔍 TIME CHECK:');
    console.log('- Current time:', currentTime);
    console.log('- Open time:', todayHours.openTime);
    console.log('- Close time:', todayHours.closeTime);
    console.log('- Is current >= open?', currentTime >= todayHours.openTime);
    console.log('- Is current <= close?', currentTime <= todayHours.closeTime);
    console.log('- Within hours?', isWithinHours ? 'YES ✅' : 'NO ❌');
    
    console.log('');
    console.log('🎯 FINAL RESULT:');
    if (todayHours.isOpen && isWithinHours) {
      console.log('✅ ORDERS SHOULD BE ALLOWED');
      console.log('✅ Business is open and within hours');
    } else if (!todayHours.isOpen) {
      console.log('❌ ORDERS BLOCKED: Business closed today');
    } else if (!isWithinHours) {
      console.log('❌ ORDERS BLOCKED: Outside business hours');
      console.log('🕒 Current time', currentTime, 'is outside', todayHours.openTime + '-' + todayHours.closeTime);
    }
    
    // Test the validation function logic (exactly what frontend uses)
    console.log('');
    console.log('🧪 VALIDATION FUNCTION TEST (FRONTEND LOGIC):');
    const validationResult = {
      valid: todayHours.isOpen && isWithinHours,
      message: (todayHours.isOpen && isWithinHours) 
        ? 'Ordine valido - siamo aperti!' 
        : (todayHours.isOpen 
          ? 'Siamo chiusi. Orari di oggi: ' + todayHours.openTime + '-' + todayHours.closeTime
          : 'Siamo chiusi oggi. Puoi effettuare ordini durante i nostri orari di apertura.')
    };
    
    console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    
    if (!validationResult.valid) {
      console.log('');
      console.log('🚨 THIS IS WHY CHECKOUT SHOWS "Ordini non disponibili"');
      console.log('The validation function returns valid=false');
      console.log('Message shown to user:', validationResult.message);
    } else {
      console.log('');
      console.log('✅ VALIDATION PASSED - Orders should be allowed');
    }

    // Additional debugging - check if it's a cache issue
    console.log('');
    console.log('🔍 CACHE DEBUGGING:');
    console.log('If the frontend still shows "Ordini non disponibili" after this test passes,');
    console.log('it means the frontend is using cached data that is outdated.');
    console.log('Solution: Clear the business hours cache in the frontend.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBusinessHoursValidation();
