// src/constants/setOrder.js
// Chronological sort index: TCGdex set ID -> integer.
// Lower number = earlier set. Used by sortCards() for date-based ordering.
// Source: index.legacy.html lines 225-253.
// DO NOT reorder or modify values — they are the authoritative sort key.

const SET_ORDER={
  "base1":1,"base2":2,"basep":3,"base3":4,"base4":5,"wp":6,"base5":7,"gym1":8,"gym2":9,
  "neo1":10,"neo2":11,"si1":12,"neo3":13,"neo4":14,"base6":15,"ecard1":16,"bp":17,"ecard2":18,"ecard3":19,
  "ex1":20,"ex2":21,"np":22,"ex3":23,"ex4":24,"ex5":25,"pop1":26,"tk1a":27,"tk1b":28,
  "ex6":29,"ex7":30,"ex8":31,"ex9":32,"pop2":33,"ex10":34,"ex11":35,"ex12":36,"pop3":37,
  "tk2a":38,"tk2b":39,"ex13":40,"ex14":41,"pop4":42,"ex15":43,"ex16":44,
  "dpp":45,"dp1":46,"pop5":47,"dp2":48,"dp3":49,"pop6":50,"dp4":51,"dp5":52,"pop7":53,"dp6":54,"dp7":55,
  "pl1":56,"pop8":57,"pl2":58,"pl3":59,"pop9":60,"ru1":61,"pl4":62,
  "hgss1":63,"hsp":64,"hgss2":65,"hgss3":66,"hgss4":67,"col1":68,
  "bwp":69,"bw1":70,"mcd11":71,"bw2":72,"bw3":73,"bw4":74,"bw5":75,"bw6":76,"mcd12":77,"dv1":78,
  "bw7":79,"bw8":80,"bw9":81,"bw10":82,"bw11":83,
  "xyp":84,"xy0":85,"xy1":86,"xy2":87,"xy3":88,"mcd14":89,"xy4":90,"xy5":91,"mcd15":92,
  "dc1":93,"xy6":94,"xy7":95,"xy8":96,"mcd16":97,"xy9":98,"g1":99,"xy10":100,"xy11":101,"xy12":102,
  "smp":103,"sm1":104,"mcd17":105,"sm2":106,"sm3":107,"sm35":108,"sm4":109,"sm5":110,"sm6":111,
  "sm7":112,"sm75":113,"mcd18":114,"sm8":115,"sm9":116,"det1":117,"sm10":118,"mcd19":119,
  "sm11":120,"sm115":121,"sma":122,"sm12":123,
  "swshp":124,"swsh1":125,"swsh2":126,"swsh3":127,"swsh35":128,"fut20":129,"swsh4":130,"mcd21":131,
  "swsh45sv":132,"swsh45":133,"swsh5":134,"swsh6":135,"swsh7":136,"cel25c":137,"cel25":138,
  "swsh8":139,"swsh9":140,"swsh9tg":141,"swsh10":142,"swsh10tg":143,"pgo":144,
  "swsh11":145,"swsh11tg":146,"tot22":147,"mcd22":148,"swsh12":149,"swsh12tg":150,
  "swsh12pt5gg":151,"swsh12pt5":152,
  "svp":153,"sv1":154,"sve":155,"sv2":156,"sv3":157,"sv3pt5":158,"tot23":159,"sv4":160,"sv4pt5":161,
  "sv5":162,"sv6":163,"sv6pt5":164,"sv7":165,"tot24":166,"sv8":167,"sv8pt5":168,
  "sv9":169,"sv10":170,"rsv10pt5":171,"zsv10pt5":172,
  "mep":173,"me1":174,"me2":175,"me2pt5":176,"me3":177,"me4":178,
  "tcgppa":179,"tcgp1":180,"tcgp1a":181,"tcgpa2":182,"tcgpa2a":183,"tcgpa2b":184,
  "tcgpa3":185,"tcgpa3a":186,"tcgpa3b":187,"tcgpa4":188,"tcgpa4a":189,"tcgpa4b":190,
  "tcgppb":191,"tcgpb1":192,"tcgpb1a":193,"tcgpb2":194,"tcgpb2a":195,"tcgpb2b":196,
};

export { SET_ORDER };
