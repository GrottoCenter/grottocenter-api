const geoJson1 = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [86.66015625, 69.193799765],
        [52.3828125, 58.263287052],
        [92.28515625, 53.330872983],
        [86.66015625, 69.193799765],
      ],
    ],
    [
      [
        [89.82421875, 68.52823492],
        [107.2265625, 59.977005492],
        [107.490234375, 68.52823492],
        [99.31640625, 70.988349224],
        [98.0859375, 73.800318164],
        [87.626953125, 72.711903108],
        [86.396484375, 69.990534959],
        [89.82421875, 68.52823492],
      ],
    ],
  ],
};

const geoJson2 = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [2.845458984375, 43.39706523932025],
        [3.504638671875, 43.77902662160831],
        [4.06494140625, 44.22945656830167],
        [4.658203125, 44.715513732021336],
        [5.064697265625, 45.213003555993964],
        [5.515136718749999, 45.85176048817254],
        [5.657958984374999, 46.255846818480315],
        [5.833740234375, 46.6795944656402],
        [5.80078125, 47.010225655683485],
        [5.756835937499999, 47.30903424774781],
        [5.4931640625, 47.76148371616669],
        [4.98779296875, 48.011975126709956],
        [4.46044921875, 48.20271028869972],
        [4.075927734375, 48.28319289548349],
        [3.5815429687499996, 48.28319289548349],
        [3.131103515625, 48.16608541901253],
        [2.8894042968749996, 48.011975126709956],
        [2.65869140625, 47.83528342275264],
        [2.548828125, 47.61356975397398],
        [2.493896484375, 47.4057852900587],
        [2.362060546875, 47.06263847995432],
        [2.35107421875, 47.25686404408872],
        [2.26318359375, 47.53203824675999],
        [2.120361328125, 47.79101617826261],
        [1.900634765625, 48.011975126709956],
        [1.64794921875, 48.21003212234042],
        [1.285400390625, 48.268569112964336],
        [0.615234375, 48.20271028869972],
        [-0.252685546875, 47.87214396888731],
        [-0.889892578125, 46.837649560937464],
        [-1.021728515625, 45.767522962149876],
        [-0.714111328125, 45.166547157856016],
        [-0.142822265625, 44.55916341529182],
        [0.823974609375, 43.99281450048989],
        [2.845458984375, 43.39706523932025],
      ],
    ],
  ],
};

const massifPolygon = {
  geoJson1,
  geoJson2,
  geoJson1ToString: JSON.stringify(geoJson1),
  geoJson2ToString: JSON.stringify(geoJson2),
  geoJson1ToWKB:
    '0106000020E610000002000000010300000001000000040000000000000040AA554070292137674C51400000000000314A406FE6DE63B3214D400000000040125740B78EC00B5AAA4A400000000040AA554070292137674C51400103000000010000000800000000000000C07456405580D699CE2151400000000080CE5A40821316840EFD4D400000000060DF5A405580D699CE2151400000000040D45840D9861A1D41BF514000000000808558409631AD69387352400000000020E85540F8B10DD28F2D52400000000060995540C89CBDEC647F514000000000C07456405580D699CE215140',
  geoJson2ToWKB:
    '0106000020E610000001000000010300000001000000230000000000000080C3064023A1A408D3B245400000000080090C40B242F324B7E345400000000080421040A25A34D55E1D46400000000000A212406E6F37F4955B46400000000040421440807655B3439B4640FFFFFFFF7F0F1640EF5CD87C06ED4640FFFFFFFFBFA116404D14AB96BF20474000000000C0551740CF3B92F3FC5647400000000000341740D05E04134F814740FFFFFFFFFF061740DDB5296F8EA747400000000000F91540ADAF644C78E147400000000080F31340D8CAA466880148400000000080D7114096432669F219484000000000C04D1040D34730AA3F2448400000000000A70C40D34730AA3F24484000000000800C09402A8079494215484000000000801D0740D8CAA46688014840000000000045054088CE3391EAEA474000000000006404400691257489CE47400000000080F303400000BBC5F0B347400000000080E50240FF6FA789048847400000000000CF02408F70C6EBE0A0474000000000001B024015074BD419C447400000000080F60040561FA40440E54740000000000069FE3FD8CAA4668801484000000000005EFA3FE2472455E21A4840000000000091F43FE3720279602248400000000000B0E33F96432669F219484000000000002CD0BF27E3DF69A2EF474000000000007AECBF1ADECE19386B4740000000000059F0BF6FAE42313EE246400000000000DAE6BFDE1DD26A51954640000000000048C2BF26E6B2AA9247464000000000005EEA3FA14CA98B14FF45400000000080C3064023A1A408D3B24540',
  geoJson1ToWKT:
    'MULTIPOLYGON(((86.66015625 69.193799765,52.3828125 58.263287052,92.28515625 53.330872983,86.66015625 69.193799765)),((89.82421875 68.52823492,107.2265625 59.977005492,107.490234375 68.52823492,99.31640625 70.988349224,98.0859375 73.800318164,87.626953125 72.711903108,86.396484375 69.990534959,89.82421875 68.52823492)))',
  geoJson2ToWKT:
    'MULTIPOLYGON(((2.845458984375 43.39706523932025,3.504638671875 43.77902662160831,4.06494140625 44.22945656830167,4.658203125 44.715513732021336,5.064697265625 45.213003555993964,5.515136718749999 45.85176048817254,5.657958984374999 46.255846818480315,5.833740234375 46.6795944656402,5.80078125 47.010225655683485,5.756835937499999 47.30903424774781,5.4931640625 47.76148371616669,4.98779296875 48.011975126709956,4.46044921875 48.20271028869972,4.075927734375 48.28319289548349,3.58154296875 48.28319289548349,3.131103515625 48.16608541901253,2.889404296875 48.011975126709956,2.65869140625 47.83528342275264,2.548828125 47.61356975397398,2.493896484375 47.4057852900587,2.362060546875 47.06263847995432,2.35107421875 47.25686404408872,2.26318359375 47.53203824675999,2.120361328125 47.79101617826261,1.900634765625 48.011975126709956,1.64794921875 48.21003212234042,1.285400390625 48.268569112964336,0.615234375 48.20271028869972,-0.252685546875 47.87214396888731,-0.889892578125 46.837649560937464,-1.021728515625 45.767522962149876,-0.714111328125 45.166547157856016,-0.142822265625 44.55916341529182,0.823974609375 43.99281450048989,2.845458984375 43.39706523932025)))',
};

module.exports = massifPolygon;