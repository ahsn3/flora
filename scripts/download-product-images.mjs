#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/assets/products');

const SOURCES = {
  rose: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5ajQl68Vcq-yYUuNb7iW9LIQuKQZRb83QWLwBZnD50lCAZesXiu_KoB-ANuJW_tHujYHq84TIrPqzmbvPKRdtND_0k239hQqnPI5jXdsOEC6_izgYdjhk7WKZ9gahTUE7Q3YJG-lOsUnCm1Yjvk8DPIwTZejr8CMtzS82qBer44lhWhtkkkKG-aavdNdo00b5Pjaj2KsIRPp1JKaOVswDyGUqlf116ol9-QzT-7dnZTw7TKr85Qs8-VCJCOGUYpje3WJZen6_buM',
  wildflower: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPmyrzPGdJPG3eRfR7f8LndEvKzXzlBY8PCcP9Lsk8t2XIsd0KH5sV0CtDYLuENlq_80VJE63VzhncTNcHIYYJmgY1jnedWV-Gs5N1bdsUOAYK3urNwb0SgCcAbu9r_AbgPoLNqX2A0f4t3aEpN-RMSPhtuhXKEFi34jcMvpLntcqUorT1TgX1ys5lB98y69txESC_9FhCi_rXYgAx0mhzhD6pdMFB-gfZKIGpBD1hx89QQS_b38GUystoxIEWv33U-12mKYDRE1U',
  orchid: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzuO_yA4sMevaZIB3xWU82vi_b_7EMQogmMLggc0wFJCsvuCHUZA9s9I2syu9di2BtHa0rWu4nffj-vjMP5Z7FHaO16jdFaluSXxctWObR7Rki-F2PiGtCitxLie4BZOFaUMR3LAy713ErKyZVOi9Mr1Yozv4QN8fxd8C5cegqO_u2aC3d-A8sdYBpLBAKaut2h51cqBOEEESEMvay8fPEG2zzJWzn5g7jHeYLd-FhNECWA6UiyEQ0b8Xt_ly5uvCdLhQlVpN1_hY',
  orchidA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZqxYV_e7PghcpTvWWN7jt7s9C1Oak6PLDqViZkE71AOfI093FyIe0Vi7Swa6Ls08iJiuerp3f6ghnJgaXIIugBJlDhiYjViobZ3bZO-XfchICZ5SjOUrEYVvCOLhwYyc9EOjFFYewX20efXF_z5Mi9gXhvaW2ZRKW2qTljsQkkOeC4LwsMnJ-0EzvoHC9Sh1xghqmCwy94UvPQBBouNS6HFUQeJeJE6shLSaMlQi60gldNOyjppUZKasMTcTv9ayJOCPnyu6U5Ec',
  orchidB: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjMb3aiwY4up_2h_hnyRYgLgQGpgkFODCFbuqqe8xskcXCiyzm3iHuRsRaNFvhJkaMbumViE7UyEJZCOAVEsbZzzyYpCv5CoTZsR-GmGEoUitiOq1RrGAcMQdnSyzAv5YBHVqK9o3jSV05oWAiHmr53za2pzWrfJZbFCU61bcmu4ycBhU9c-CxPDCy2WVQwTMmgFOuATcd11vk_F3XnNWlhJiCkYs3EzhW7zId9Nn_YKiUeXtLE50OgdBa9EjWQfg13vek1j7LOO0',
  orchidC: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1hwgidG7FvG-N4XdU4A1UsPLqDGTU_LXFSpMa_Vht5AhkSM9nuzvQARWPTNdiqik2jkjJ7_OWAkJTODF93uN-8SwxHSecEhGALmd1PG5q8MZWADVbaExFx_RidYuiYO_UwUxw-JBJuHbhHY2kgbPqj69KkTJjW8Baji7AeCC2CCQCoqKOhoiJs_VWUpWw_DUio-gHzav2gjGsLEKIhw39e4ypUCoROvj3cJO2aRevIwjcKYXyfLd8-9MZxzcI_acpKlsoCbSBbZc',
  sunflower: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzLOxtbM1fVipL_SvUeMJXs821NO09J0OZWc2xyZ5lchUE7qCVxTQPWe5N73efKSJXdLTmwMcODI9TArR205sfuxe112jq9CZ2V_VrGmgefHgx9GJaomGMBuPH3wlNfnyXo0noD8oFU56FrIEOiCwU4E1ZgXfluUdJ1O9uRoG-kOGbqpMJz5lDAcRyGObBG0OAbef7VWDpMTU8xL7UZTJwG_OF3j_47_HW7dB-v12mb3teryGZkjj6wXl92vFfT8BLCJo8GqCAXJs',
  hamper: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZlwvjiTb9f-Rm3BT1LVbEC2bif2kSgvvE_41sV4Ry6ok7dJqUcOIOljpAYVJfCG6YbQ3-FMGzWJyJAa3o3X780T3_l2cQPgcsYc5O1dtwfFgkKZLKwS8ZsYbNUD2OVrup9_3oN6IfqqNaB1FmeaNihV3QfrWnRmPaLIqd0wGh-5hkY3ukVoyATeqDfcVHUg1VAmQx2zGmMy37OMC0ck3wqaV0rZtEsCwcK61XDCfOPS1KTrSmzEVjOigs_e3jFBAaludkw_NRsQ',
  candle: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKUIulVIxvB-DNOhcI4de5P1ydcn7CyC0jT8rVuD4sj8owTXntPpbNms7OGRjQ-EatikLvObYtzWsuey6roIN2J8OI4uxLh3BJfEi_pf3w2ZULVs7TWojyPI0SMdX1JeEu98wTmjvKD7rNDMpFCA_RgFreVz8ls7MvMOQQGv44nyLSPglsbR_YauWRfU-Xl8IiHH0gw075DyVTmTC7cEaVmh4X7KyY8A3tavylA4tgCajjtweiuZByzRWVO0hp9SEiSUQsXRALeec',
  vase: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-sR3Hv1aJIl1ck1YGoPqVAeauIpWHryHkq2CJduz75Hf5rynZ14EFqXDiJoU__Qp9le3TQ52zDUNYv1Rpv_eEndzctOdUzEAOS-ctszlTsN86vFW6cxn16xMhDvEBP9-z7arHZKgDyW5OT_SaQdAWAGkK3-ebL3nXnN66-5A5cSYoDTPdFwyAksBS8YyRsaheq409ICa79G7Cl2_vsr2CzHehZtBeP7kjegx8jhMyiVY1nJ7a2cCoiyeqG4P5YEiWLld3kJbbTM0',
  wedding: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0Ndkx0FeKWwADrpc2mdBqIA_XhzugoZgFNkFhOTdmHO9HpZcejMeGcIKT8968lnptjccEbpsEAlOOMBecRznxiSG7uHFkKIIayRkGkxtHtD8y0Vga3upJNhFWlz91KitBO9-7MMtLSawMHftQMucvt_ME1ikF3A-D_STUI9hBXgNggsmS0wjtK35erDTcSYFaiyzNE4CNrzO2n2_m3aMuFdafw48WDWqqKmWBq_aSPDg1RTUHk8sJjaAB1p-i7QHjrkoXTwTRJrk',
  bridal: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5dWZLG2wemPVCyYvlD39psdOUOOdpFcxKwWcbLLORL5R8DKyqON4cY4w63Nfek7nsisicVxeoxh9r3QpYcO-zwtEita7ltaLdDV1I5KRbhazlvtPwAv0a4EKWhxd4lOVt9Vj_Fi8A6nTE3ZCeV7nWzlYiBVen6j_HKeZ2cxXNKWnOwrnpRRL9yvC3jY3Uzb1va26nxmur1Lg1fCtOUxLRE96LOURI7g2cBqZBlk9T2NeVTEaLmYp39FahWFF06cMOvdn12GT_xWw',
  homeRose: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWdgTXEmAM8ks7R7zKMzf2onHL_ktMblFMrFoPPQAmovR-8vusk9SZ8BAS5jFM1pLipAN3OPdKiNikK0DTgoN4KrSzIMkt37Jjx1BXEAUdmEiky_I33kBVVoU3We01DlAbojra2Vdyzv6Vx1wHY35GEgEIhHxnUzHTxOFf-y5gILjaIEiPYlcRTwQ-XZVpQk-Ne1GLTqYZHYPXYxFOmJHrAO2UrK75rkODQLBHdjss_eK4BdyZX7CbdvvJvlZzWL99CTdGj1w9fGU',
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjKytaVgRyRduHtBR4AX3HFH45R_T6g2GrnkGNuDKz96nldYF3JrmoKZmPSbai06hDeOqVKFcHEVkhSPSB213Dg1KXCHc5ZZXQb1AAKdOQlahxI_TMR3YFgssfVcKb0lL3uKIqDgI3K9usKilKWbKIBrc1f26ccvq_feNWMS2XY_hkQXWjKGWriZUxhD8hvnMrA4HHWTw18TrTqBcYD4JYGQtHoKa33DnMtIqrOh5ihPKjnza36ihJ5k0Y9HoF8yrY10uq9V9_JMI',
  eventMain: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnDLSdUBM-1zllBEuTLi-__E2Luh0tVd4raM2kmAcHSoVxeAYGJtmyQzUwKxJJ3hYkoostGHEC6DNWhFJDR1gzPtVusj0pTQhzYrofusYLEtWnbCYv-Rj25jsUOqmEr7goOVFZ3LwzpJJI92RL1OenLfWjv8PqyC7RkMQ6ki1wdwKAGY20zleJlH6JM_ZFNyRU2KgIIvEn4YZHhONYxbnuvcezqpqV8tCbvNx2TjZUgoVYKgBIikn9K7F3ECgv6wIriwFoTx0A01Q',
  eventGarden: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNOV-ExAcb4cOfeXnKlufWuHyhw9rRva_iEX2YXb22ELOAh8dDLLDd7p9PvtHtmBM5bZ_DVNrU09Rsr9I-pF7JyxUA0lYERh519kyMMC4_COlcgfFt3MbXoWN_yo0CKk9UQ2ZkjmDezvq_HaSSEN777HjHdsCg-5VvqHTKE1v38amGtpOin5G-haWWVZ5byde2-nkTLxhCnoqYljq2BxYdSMzEJ1-FnDN_Z1nN-TJiULRsMQsRhKykJVfAz2ei4xHS_zxpkoBXDWU',
  eventCorp: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3097KEuAEt6VeE6bZRGDFxgN7eBUX7Dw8XYGH7CMBcaE-Roh3bU-6haA3gxAsXTHR87wIGiMHUu9mui4lWa1yOR5fjItxpztFW64e8TYPxm1-jo5bactxHX7fLlBGldPLUIqvLWWlqHLtkexc-2-L0tafb6Ht1Kdd8s9j0_IIzbBMVLFX8RYy_jS6OzmJx2cPXDxlFx0TY7fQuC1JDQZEC0Ph7PtvLZyAxZeWUkflY4jjDrXf_9l-jqmKyP-oWdUCcAjR9x1yDEQ',
};
const FILES = {
  'romantic-rose-bouquet': 'rose',
  'spring-wildflowers': 'wildflower',
  'orchid-elegance': 'orchid',
  'orchid-elegance-2': 'orchidA',
  'orchid-elegance-3': 'orchidB',
  'orchid-elegance-4': 'orchidC',
  'sunflower-sunshine': 'sunflower',
  'luxury-gift-hamper': 'hamper',
  'chocolate-and-roses': 'homeRose',
  'scented-candle-set': 'candle',
  'wedding-centerpiece': 'wedding',
  'bridal-bouquet': 'bridal',
  'terra-ceramic-vase': 'vase',
  'lavender-dreams': 'orchidB',
  'birthday-bloom-box': 'eventMain',
  'peony-blush-garden': 'hero',
  'midnight-tulip-trio': 'orchidA',
  'citrus-and-bloom': 'sunflower',
  'artisan-tea-and-bloom': 'hamper',
  'velvet-jewelry-box-rose': 'rose',
  'garden-party-centerpiece': 'eventGarden',
  'mini-succulent-grove': 'vase',
  'hydrangea-cloud': 'wildflower',
  'rose-gold-anniversary': 'homeRose',
  'ceremony-aisle-petals': 'bridal',
  'sympathy-white-lilies': 'wedding',
};

fs.mkdirSync(outDir, { recursive: true });

for (const [file, key] of Object.entries(FILES)) {
  const url = SOURCES[key];
  const dest = path.join(outDir, `${file}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
    console.log('skip', file);
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log('ok', file, buf.length);
}
