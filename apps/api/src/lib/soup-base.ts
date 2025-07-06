import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY as string

const soupbase = createClient(SUPABASE_URL, SUPABASE_API_KEY)

export const logsChannel = soupbase.channel('logs')


export default soupbase