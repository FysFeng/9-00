export type OfferLogic = 'AND' | 'OR' | 'AND + OR' | 'PRICE_ONLY' | 'SIMPLE';

export type OfferChangeType =
  | 'PRICE_DOWN'
  | 'EMI_UP'
  | 'BENEFIT_ADDED'
  | 'BENEFIT_CLARIFIED'
  | 'NEW_MODEL'
  | 'NO_PUBLIC_CHANGE';

export interface CurrentOffer {
  id: string;
  brand: string;
  model: string;
  startingEmi: string;
  startingPrice: string;
  offerLogic: OfferLogic;
  mainOffer: string;
  sourceStatus: string;
  updatedAt: string;
  details: Record<string, string>;
}

export interface OfferChange {
  id: string;
  date: string;
  brand: string;
  model: string;
  changeType: OfferChangeType;
  previousValue: string;
  currentValue: string;
  impact: string;
  source: string;
}

export const currentOffers: CurrentOffer[] = [
  {
    "id": "byd-ti-7",
    "brand": "BYD",
    "model": "Ti 7",
    "startingEmi": "-",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "免保险 + 免费",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "insurance": "免保险",
      "registration": "免费"
    }
  },
  {
    "id": "byd-seal-7",
    "brand": "BYD",
    "model": "SEAL 7",
    "startingEmi": "AED 1,599/mo",
    "startingPrice": "AED 109,900",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 4? / 90,000km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "4? / 90,000km"
    }
  },
  {
    "id": "byd-song-plus",
    "brand": "BYD",
    "model": "SONG PLUS",
    "startingEmi": "AED 1,699/mo",
    "startingPrice": "AED 119,900",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 免费",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "免费"
    }
  },
  {
    "id": "byd-shark-6",
    "brand": "BYD",
    "model": "SHARK 6",
    "startingEmi": "AED 2,399/mo",
    "startingPrice": "AED 158,900",
    "offerLogic": "AND",
    "mainOffer": "0% finance + 免保险 + 免费 + 2? / 45,000km + ????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "insurance": "免保险",
      "registration": "免费",
      "service": "2? / 45,000km",
      "finance": "0% finance",
      "tinting": "????"
    }
  },
  {
    "id": "byd-sealion-7",
    "brand": "BYD",
    "model": "SEALION 7",
    "startingEmi": "AED 2,199/mo",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 免费 + 1年 ADNOC charging",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "免费",
      "charging": "1年 ADNOC charging"
    }
  },
  {
    "id": "byd-sealion-5",
    "brand": "BYD",
    "model": "SEALION 5",
    "startingEmi": "AED 1,399/mo",
    "startingPrice": "AED 89,900",
    "offerLogic": "AND",
    "mainOffer": "0% finance + ???? + 免费 + 2? / 45,000km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "insurance": "????",
      "registration": "免费",
      "service": "2? / 45,000km",
      "finance": "0% finance"
    }
  },
  {
    "id": "byd-seal",
    "brand": "BYD",
    "model": "SEAL",
    "startingEmi": "AED 1,999/mo",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 免费 + 1年 ADNOC charging",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "免费",
      "charging": "1年 ADNOC charging"
    }
  },
  {
    "id": "byd-qin-plus",
    "brand": "BYD",
    "model": "QIN PLUS",
    "startingEmi": "AED 1,099/mo",
    "startingPrice": "AED 74,900",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 免费",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "免费"
    }
  },
  {
    "id": "byd-atto-8",
    "brand": "BYD",
    "model": "ATTO 8",
    "startingEmi": "AED 2,399/mo",
    "startingPrice": "AED 159,900",
    "offerLogic": "AND",
    "mainOffer": "免保险 + 免费 + 3? / 65,000km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "insurance": "免保险",
      "registration": "免费",
      "service": "3? / 65,000km"
    }
  },
  {
    "id": "byd-han",
    "brand": "BYD",
    "model": "HAN",
    "startingEmi": "AED 2,699/mo",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "零利率 + 免保险 + 免费 + 免费 + 免费家里充电",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "零利率",
      "insurance": "免保险",
      "registration": "免费",
      "service": "免费",
      "charging": "免费家里充电"
    }
  },
  {
    "id": "byd-seal-6",
    "brand": "BYD",
    "model": "SEAL 6",
    "startingEmi": "AED 1,399/mo",
    "startingPrice": "AED 87,900",
    "offerLogic": "AND",
    "mainOffer": "免费 + 2? / 45,000km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "registration": "免费",
      "service": "2? / 45,000km"
    }
  },
  {
    "id": "jetour-t1",
    "brand": "Jetour",
    "model": "T1",
    "startingEmi": "AED 1,349/mo",
    "startingPrice": "-",
    "offerLogic": "OR",
    "mainOffer": "3年零利率 或 免增值税 + 3 年 / 30,000 km service package + 10 年 / 1M km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "3年零利率 或 免增值税",
      "service": "3 年 / 30,000 km service package",
      "warranty": "10 年 / 1M km",
      "note": "6个月后付款"
    }
  },
  {
    "id": "jetour-g700",
    "brand": "Jetour",
    "model": "G700",
    "startingEmi": "AED 2,499/mo",
    "startingPrice": "AED 169,000",
    "offerLogic": "OR",
    "mainOffer": "3年零利率 或 免增值税 + 1M km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "3年零利率 或 免增值税",
      "warranty": "1M km",
      "note": "6个月后付款"
    }
  },
  {
    "id": "jetour-t2",
    "brand": "Jetour",
    "model": "T2",
    "startingEmi": "AED 1,899/mo",
    "startingPrice": "-",
    "offerLogic": "OR",
    "mainOffer": "3年零利率 或 免增值税 + 3 年 / 30,000 km service package + 10 年 / 1M km",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "3年零利率 或 免增值税",
      "service": "3 年 / 30,000 km service package",
      "warranty": "10 年 / 1M km",
      "note": "6个月后付款"
    }
  },
  {
    "id": "toyota-camry",
    "brand": "Toyota",
    "model": "Camry",
    "startingEmi": "AED 1,349/mo",
    "startingPrice": "AED 122,900",
    "offerLogic": "OR",
    "mainOffer": "Option: 0% finance up to 5 年 + ????? + ????? + ????? + ????? + ?????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "Option: 0% finance up to 5 年",
      "insurance": "?????",
      "registration": "?????",
      "service": "?????",
      "warranty": "?????",
      "tinting": "?????",
      "note": "缺乏具体信息"
    }
  },
  {
    "id": "toyota-land-cruiser",
    "brand": "Toyota",
    "model": "Land Cruiser",
    "startingEmi": "AED 2,999/mo",
    "startingPrice": "AED 239,900",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "?????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {}
  },
  {
    "id": "toyota-urban-cruiser",
    "brand": "Toyota",
    "model": "Urban Cruiser",
    "startingEmi": "AED 899/mo",
    "startingPrice": "AED 79,900",
    "offerLogic": "AND",
    "mainOffer": "???? + ???? + ???? + ?? + ????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "insurance": "????",
      "registration": "????",
      "service": "????",
      "warranty": "??",
      "tinting": "????",
      "note": "缺乏具体信息"
    }
  },
  {
    "id": "gwm-tank-tank-300",
    "brand": "GWM / TANK",
    "model": "TANK 300",
    "startingEmi": "AED 1,899/mo",
    "startingPrice": "AED 109,900 + VAT",
    "offerLogic": "AND",
    "mainOffer": "Payment protection + 免费保险 + 免费注册 + 5 年 premium service plan + 5 年 + ??3M??",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "paymentProtection": "Payment protection",
      "insurance": "免费保险",
      "registration": "免费注册",
      "service": "5 年 premium service plan",
      "roadside": "5 年",
      "tinting": "??3M??"
    }
  },
  {
    "id": "gwm-tank-tank-500",
    "brand": "GWM / TANK",
    "model": "TANK 500",
    "startingEmi": "AED 2,499/mo",
    "startingPrice": "AED 149,900 + VAT",
    "offerLogic": "AND",
    "mainOffer": "Payment protection + 免费保险 + 免费注册 + 5 年 premium service plan + 5 年 + ??3M??",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "paymentProtection": "Payment protection",
      "insurance": "免费保险",
      "registration": "免费注册",
      "service": "5 年 premium service plan",
      "roadside": "5 年",
      "tinting": "??3M??"
    }
  },
  {
    "id": "gwm-tank-h7",
    "brand": "GWM / TANK",
    "model": "H7",
    "startingEmi": "AED 1,499/mo",
    "startingPrice": "AED 99,900 + VAT",
    "offerLogic": "AND + OR",
    "mainOffer": "3年零利率 或 免增值税 + Payment protection + Option B: free 3 年 service contract + 6 年 / 200,000 km + 3-5 年",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "3年零利率 或 免增值税",
      "paymentProtection": "Payment protection",
      "service": "Option B: free 3 年 service contract",
      "warranty": "6 年 / 200,000 km",
      "roadside": "3-5 年"
    }
  },
  {
    "id": "gwm-tank-h9",
    "brand": "GWM / TANK",
    "model": "H9",
    "startingEmi": "AED 1,799/mo",
    "startingPrice": "AED 119,900 + VAT",
    "offerLogic": "AND + OR",
    "mainOffer": "3年零利率 或 免增值税 + Payment protection + ??B?insurance support + ??B????? + Option B: free 3 年 service contract + 6 年 / 200,000 km + Option B + 5 年 official roadside + ??B?window tinting",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "finance": "3年零利率 或 免增值税",
      "paymentProtection": "Payment protection",
      "insurance": "??B?insurance support",
      "registration": "??B?????",
      "service": "Option B: free 3 年 service contract",
      "warranty": "6 年 / 200,000 km",
      "roadside": "Option B + 5 年 official roadside",
      "tinting": "??B?window tinting"
    }
  },
  {
    "id": "gwm-tank-jolion-pro",
    "brand": "GWM / TANK",
    "model": "Jolion Pro",
    "startingEmi": "AED 1,049/mo",
    "startingPrice": "AED 69,900 + VAT",
    "offerLogic": "AND + OR",
    "mainOffer": "Payment protection + ??A????? + Option A: free 3 年 service contract + 6 年 / 200,000 km + 5 年 + ??B?AED 10,000????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "paymentProtection": "Payment protection",
      "registration": "??A?????",
      "service": "Option A: free 3 年 service contract",
      "warranty": "6 年 / 200,000 km",
      "roadside": "5 年",
      "cashDiscount": "??B?AED 10,000????"
    }
  },
  {
    "id": "nissan-altima",
    "brand": "Nissan",
    "model": "Altima",
    "startingEmi": "AED 1,950/mo",
    "startingPrice": "AED 110,500",
    "offerLogic": "AND",
    "mainOffer": "5 年 / 100,000 km + 5 年 + 5 年 + 3?????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "service": "5 年 / 100,000 km",
      "warranty": "5 年",
      "roadside": "5 年",
      "fuel": "3?????"
    }
  },
  {
    "id": "nissan-x-trail",
    "brand": "Nissan",
    "model": "X-Trail",
    "startingEmi": "AED 1,890/mo",
    "startingPrice": "AED 103,900",
    "offerLogic": "AND",
    "mainOffer": "5 年 / 100,000 km + 5 年 + 5 年 + ??3?????",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "service": "5 年 / 100,000 km",
      "warranty": "5 年",
      "roadside": "5 年",
      "fuel": "??3?????"
    }
  },
  {
    "id": "nissan-kicks",
    "brand": "Nissan",
    "model": "Kicks",
    "startingEmi": "AED 1,300/mo",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "3 年 / 60,000 km + 5 年 + 5 年",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "service": "3 年 / 60,000 km",
      "warranty": "5 年",
      "roadside": "5 年"
    }
  },
  {
    "id": "nissan-patrol",
    "brand": "Nissan",
    "model": "Patrol",
    "startingEmi": "-",
    "startingPrice": "-",
    "offerLogic": "AND",
    "mainOffer": "Free 5 年 service + 5 年 + 5 年",
    "sourceStatus": "???? + ????",
    "updatedAt": "2026-05-28",
    "details": {
      "service": "Free 5 年 service",
      "warranty": "5 年",
      "roadside": "5 年"
    }
  },
  {
    "id": "mitsubishi-outlander",
    "brand": "Mitsubishi",
    "model": "Outlander",
    "startingEmi": "-",
    "startingPrice": "AED 79,900*",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "无活动",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "无活动"
    }
  },
  {
    "id": "mitsubishi-asx",
    "brand": "Mitsubishi",
    "model": "ASX",
    "startingEmi": "-",
    "startingPrice": "AED 59,900*",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "SUV?????",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "?????????????/?????"
    }
  },
  {
    "id": "mitsubishi-xpander",
    "brand": "Mitsubishi",
    "model": "Xpander",
    "startingEmi": "-",
    "startingPrice": "AED 60,900*",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "SUV?????",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "?????????????/?????"
    }
  },
  {
    "id": "mitsubishi-eclipse-cross",
    "brand": "Mitsubishi",
    "model": "Eclipse Cross",
    "startingEmi": "-",
    "startingPrice": "AED 63,900*",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "SUV?????",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "?????????????/?????"
    }
  },
  {
    "id": "mitsubishi-montero-sport",
    "brand": "Mitsubishi",
    "model": "Montero Sport",
    "startingEmi": "-",
    "startingPrice": "AED 96,900*",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "SUV?????",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "?????????????/?????"
    }
  },
  {
    "id": "mitsubishi-destinator",
    "brand": "Mitsubishi",
    "model": "Destinator",
    "startingEmi": "-",
    "startingPrice": "AED 69,900",
    "offerLogic": "PRICE_ONLY",
    "mainOffer": "SUV?????",
    "sourceStatus": "????",
    "updatedAt": "2026-05-28",
    "details": {
      "note": "?????????????/?????"
    }
  }
];

export const offerChanges: OfferChange[] = [
  {
    "id": "byd-seal-7-change",
    "date": "2026-05-28",
    "brand": "BYD",
    "model": "SEAL 7",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "AED 1,499/mo",
    "currentValue": "AED 1,599/mo",
    "impact": "月供上调 AED 100；权益更明确为 4年/90,000km free service",
    "source": "offer info.xlsx"
  },
  {
    "id": "byd-shark-6-change",
    "date": "2026-05-28",
    "brand": "BYD",
    "model": "SHARK 6",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "Free registration + service",
    "currentValue": "Free registration + 0% finance + 2年/45,000km service + free tint",
    "impact": "优惠增加",
    "source": "offer info.xlsx"
  },
  {
    "id": "byd-sealion-5-change",
    "date": "2026-05-28",
    "brand": "BYD",
    "model": "SEALION 5",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "Free registration + service",
    "currentValue": "Free registration + free insurance + 0% finance + 2年/45,000km service",
    "impact": "优惠增加",
    "source": "offer info.xlsx"
  },
  {
    "id": "byd-atto-8-change",
    "date": "2026-05-28",
    "brand": "BYD",
    "model": "ATTO 8",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "Free registration + service",
    "currentValue": "Free registration + 3年/65,000km service",
    "impact": "服务期限明确",
    "source": "offer info.xlsx"
  },
  {
    "id": "byd-seal-6-change",
    "date": "2026-05-28",
    "brand": "BYD",
    "model": "SEAL 6",
    "changeType": "EMI_UP",
    "previousValue": "AED 1,299/mo",
    "currentValue": "AED 1,399/mo",
    "impact": "官网现在显示 AED 1,399/mo；应覆盖旧记录",
    "source": "offer info.xlsx"
  },
  {
    "id": "gwm-tank-tank-300-change",
    "date": "2026-05-28",
    "brand": "GWM / TANK",
    "model": "TANK 300",
    "changeType": "PRICE_DOWN",
    "previousValue": "AED 119,900 + VAT",
    "currentValue": "AED 109,900 + VAT",
    "impact": "官方首页显示起价下降 AED 10,000",
    "source": "offer info.xlsx"
  },
  {
    "id": "gwm-tank-tank-500-change",
    "date": "2026-05-28",
    "brand": "GWM / TANK",
    "model": "TANK 500",
    "changeType": "PRICE_DOWN",
    "previousValue": "AED 159,900 + VAT",
    "currentValue": "AED 149,900 + VAT",
    "impact": "官方首页显示起价下降 AED 10,000",
    "source": "offer info.xlsx"
  },
  {
    "id": "nissan-altima-change",
    "date": "2026-05-28",
    "brand": "Nissan",
    "model": "Altima",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "AED 1,950/mo + 5年保修/服务/路援",
    "currentValue": "新增 3 Years Free Fuel",
    "impact": "Abu Dhabi 新夏季活动，优惠增加",
    "source": "offer info.xlsx"
  },
  {
    "id": "nissan-x-trail-change",
    "date": "2026-05-28",
    "brand": "Nissan",
    "model": "X-Trail",
    "changeType": "BENEFIT_ADDED",
    "previousValue": "AED 1,890/mo + 5年保修/服务/路援",
    "currentValue": "新增 up to 3 Years Free Fuel",
    "impact": "Abu Dhabi 新夏季活动，优惠增加",
    "source": "offer info.xlsx"
  },
  {
    "id": "mitsubishi-destinator-change",
    "date": "2026-05-28",
    "brand": "Mitsubishi",
    "model": "Destinator",
    "changeType": "NEW_MODEL",
    "previousValue": "未收录",
    "currentValue": "AED 69,900 起",
    "impact": "新增车型/新 offer 项",
    "source": "offer info.xlsx"
  }
];
