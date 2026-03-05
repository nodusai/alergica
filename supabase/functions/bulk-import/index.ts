import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function detectSeparator(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download('medications.csv');

    if (downloadError || !fileData) {
      throw new Error(`Failed to download CSV: ${downloadError?.message}`);
    }

    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(l => l.trim());
    
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const separator = detectSeparator(headerLine);
    const header = parseCSVLine(headerLine, separator).map(h => h.trim());
    const dataLines = lines.slice(1);
    
    console.log(`Separator: "${separator}", Header: ${JSON.stringify(header)}`);
    console.log(`Total data lines: ${dataLines.length}`);
    
    const BATCH_SIZE = 200;
    let inserted = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(i, i + BATCH_SIZE);
      const rows = batch.map(line => {
        const values = parseCSVLine(line, separator);
        const row: Record<string, unknown> = {};
        
        header.forEach((col, idx) => {
          const val = values[idx]?.trim();
          if (!val || val === '') {
            row[col] = null;
          } else if (col === 'tem_risco_aplv') {
            row[col] = val === 'true';
          } else if (col === 'access_count') {
            row[col] = parseInt(val) || 0;
          } else if (['termos_encontrados', 'avisos', 'detalhes_criticos', 'detalhes_atencao'].includes(col)) {
            try {
              row[col] = JSON.parse(val);
            } catch {
              row[col] = [];
            }
          } else {
            row[col] = val;
          }
        });
        
        return row;
      }).filter(r => r.id != null && r.id !== '');

      if (rows.length === 0) continue;

      const { error } = await supabase.from('medications').upsert(rows, { onConflict: 'id' });
      
      if (error) {
        errorMessages.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
        errors++;
      } else {
        inserted += rows.length;
      }
      
      if (i % 1000 === 0) {
        console.log(`Progress: ${inserted} inserted, ${errors} errors`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, errors, total: dataLines.length, errorMessages }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
