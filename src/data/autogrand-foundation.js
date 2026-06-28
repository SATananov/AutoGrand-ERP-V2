export const AUTOGRAND_COMPANY = {
  code: 'AG-OOD',
  name: 'Автогранд ООД',
  city: 'София',
  address: 'бул. Черни връх 157',
  phone: '+359 2 962 2995'
};

export const DEFAULT_LOCATION_CODE = 'AG-KJ-SHOP';

export const LOCATION_RULES = {
  office: {
    canHoldStock: false,
    canSell: false,
    canReceivePurchases: false,
    canTransfer: false
  },
  centralWarehouse: {
    canHoldStock: true,
    canSell: false,
    canReceivePurchases: true,
    canTransfer: true
  },
  sellingTransferLocation: {
    canHoldStock: true,
    canSell: true,
    canReceivePurchases: true,
    canTransfer: true
  }
};

function rule(ruleName) {
  return { ...LOCATION_RULES[ruleName] };
}

export const AUTOGRAND_LOCATIONS = [
  {
    code: 'AG-SOF-OFFICE',
    name: 'Централен офис',
    type: 'OFFICE',
    city: 'София',
    address: 'бул. Черни връх 157',
    phone: '+359 2 962 2995',
    email: 'office@autogrand.bg',
    sortOrder: 10,
    ...rule('office')
  },
  {
    code: 'AG-STZ-CENTRAL',
    name: 'Централен склад',
    type: 'CENTRAL_WAREHOUSE',
    city: 'Стара Загора',
    address: 'ул. Новозагорско шосе 35001, срещу РАЗСАДНИК "РАЗЦВЕТ"',
    phone: '0882 442 069',
    email: 'stz_sklad@autogrand.bg',
    sortOrder: 20,
    ...rule('centralWarehouse')
  },
  {
    code: 'AG-SOF-ROJEN',
    name: 'Регионален склад София Рожен',
    type: 'REGIONAL_WAREHOUSE',
    city: 'София',
    address: 'бул. Рожен 22, НПЗ Военна рампа',
    phone: '02 936 04 04; 02 488 62 99; 02 426 71 44; 0884 00 03 60; 0878 40 13 62; 0878 40 13 61',
    email: 'sofia_rojen@autogrand.bg',
    sortOrder: 30,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-BLG-WH',
    name: 'Регионален склад Благоевград',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Благоевград',
    address: 'бул. Васил Левски 38',
    phone: '073 88 23 01; 0884 61 74 47',
    email: 'blagoevgrad@autogrand.bg',
    sortOrder: 40,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-PDV-WH',
    name: 'Регионален склад Пловдив',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Пловдив',
    address: 'бул. Асеновградско шосе 2',
    phone: '0887 90 21 17; 0882 82 90 16',
    email: 'plovdiv@autogrand.bg',
    sortOrder: 50,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-PDV-NORTH',
    name: 'Регионален склад Пловдив Север',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Пловдив',
    address: 'ул. Васил Левски 177',
    phone: '0882 126 212; 0882 660 051',
    email: 'plovdiv_sever@autogrand.bg',
    sortOrder: 60,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-STZ-WH',
    name: 'Регионален склад Стара Загора',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Стара Загора',
    address: 'ул. Новозагорско шосе 35001, срещу РАЗСАДНИК "РАЗЦВЕТ"',
    phone: '042 64 64 60; 0888 56 27 89',
    email: 'st.zagora@autogrand.bg',
    sortOrder: 70,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-HSK-WH',
    name: 'Регионален склад Хасково',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Хасково',
    address: 'бул. Илинден 6',
    phone: '038 66 41 28; 0882 75 81 00; 0888 26 91 98',
    email: 'haskovo_sklad@autogrand.bg',
    sortOrder: 80,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-BGS-WH',
    name: 'Регионален склад Бургас',
    type: 'REGIONAL_WAREHOUSE',
    city: 'Бургас',
    address: 'ул. Индустриална 51',
    phone: '056 84 02 44; 0882 424 908; 0884 422 131; 0879 140 091; 0879 140 092',
    email: 'burgas@autogrand.bg',
    sortOrder: 90,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-YAM-SHOP',
    name: 'Търговски обект Ямбол',
    type: 'SHOP',
    city: 'Ямбол',
    address: 'ул. Ормана 68',
    phone: '0887 79 20 33',
    email: 'yambol@autogrand.bg',
    sortOrder: 110,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-HRM-SHOP',
    name: 'Търговски обект Харманли',
    type: 'SHOP',
    city: 'Харманли',
    address: 'Главен път E80 Паркинг КВЕЛЕ',
    phone: '0888 26 91 99',
    email: 'harmanli@autogrand.bg',
    sortOrder: 120,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-SLV-SHOP',
    name: 'Търговски обект Сливен',
    type: 'SHOP',
    city: 'Сливен',
    address: 'бул. Цар Симеон 43',
    phone: '044 62 31 39; 0885 33 58 71',
    email: 'sliven@autogrand.bg',
    sortOrder: 130,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-SAN-SHOP',
    name: 'Търговски обект Сандански',
    type: 'SHOP',
    city: 'Сандански',
    address: 'ул. Стефан Стамболов 49',
    phone: '0892 21 26 83; 0878 28 26 17; 0887 58 59 98',
    email: 'sandanski@autogrand.bg',
    sortOrder: 140,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-PET-SHOP',
    name: 'Търговски обект Петрич',
    type: 'SHOP',
    city: 'Петрич',
    address: 'ул. Места 18 Б',
    phone: '0884 45 03 23; 0889 49 98 30',
    email: 'petrich@autogrand.bg',
    sortOrder: 150,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-KJ-SHOP',
    name: 'Търговски обект Кърджали',
    type: 'SHOP',
    city: 'Кърджали',
    address: 'бул. България 99',
    phone: '0887 79 20 28',
    email: 'kardjali@autogrand.bg',
    isDefault: true,
    isCurrent: true,
    sortOrder: 160,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-KZK-SHOP',
    name: 'Търговски обект Казанлък',
    type: 'SHOP',
    city: 'Казанлък',
    address: 'бул. Александър Батенберг 12',
    phone: '0889 28 66 08',
    email: 'kazanlak@autogrand.bg',
    sortOrder: 170,
    ...rule('sellingTransferLocation')
  },
  {
    code: 'AG-DGR-SHOP',
    name: 'Търговски обект Димитровград',
    type: 'SHOP',
    city: 'Димитровград',
    address: 'бул. Стефан Стамболов 65',
    phone: '0391 6 38 08; 0887 20 75 95',
    email: 'dimitrovgrad@autogrand.bg',
    sortOrder: 180,
    ...rule('sellingTransferLocation')
  }
];

export function isCurrentLocation(location) {
  return location?.code === DEFAULT_LOCATION_CODE || location?.isCurrent === true;
}

export function locationTransferCapabilities(location) {
  const canTransfer = Boolean(location?.canTransfer);
  return {
    canRequestTransfer: canTransfer,
    canDispatchTransfer: canTransfer,
    canReceiveTransfer: canTransfer
  };
}
