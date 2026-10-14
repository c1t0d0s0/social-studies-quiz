// 47 都道府県。都道府県クイズ (pref-quiz) から移したもの。
// 形 (SVG のパス) は data/figures/pref-paths.ts にある (大きいので、図をはじめて出すときに読みこむ)。

export interface Pref {
  /** 都道府県の番号 (1〜47。北海道が 1、沖縄県が 47) */
  id: number;
  name: string;
  kana: string;
  region: string;
  /** 都道府県庁のある所 (東京都は新宿区) */
  capital: string;
  hint: string;
  /** 形が似ていて、まちがえやすい都道府県の番号 (形のクイズの選択肢にする) */
  similar: number[];
}

/** 地方。図鑑では、この順にならべる */
export const PREF_REGIONS: readonly string[] = ['北海道地方', '東北地方', '関東地方', '中部地方', '近畿地方', '中国地方', '四国地方', '九州地方'];

export const PREFS: readonly Pref[] = [
  { id: 1, name: "北海道", kana: "ほっかいどう", region: "北海道地方", capital: "札幌市", hint: "日本でいちばん広大な都道府県！", similar: [3, 7, 20] },
  { id: 2, name: "青森県", kana: "あおもりけん", region: "東北地方", capital: "青森市", hint: "りんごの生産量が日本一！", similar: [46, 5, 45] },
  { id: 3, name: "岩手県", kana: "いわてけん", region: "東北地方", capital: "盛岡市", hint: "本州で一番大きな県！", similar: [5, 4, 7] },
  { id: 4, name: "宮城県", kana: "みやぎけん", region: "東北地方", capital: "仙台市", hint: "伊達政宗や「ずんだ」が有名！", similar: [7, 3, 8] },
  { id: 5, name: "秋田県", kana: "あきたけん", region: "東北地方", capital: "秋田市", hint: "きりたんぽや秋田犬が有名！", similar: [6, 2, 3] },
  { id: 6, name: "山形県", kana: "やまがたけん", region: "東北地方", capital: "山形市", hint: "さくらんぼの生産量が日本一！", similar: [5, 15, 17] },
  { id: 7, name: "福島県", kana: "ふくしまけん", region: "東北地方", capital: "福島市", hint: "桃や会津若松城が有名！", similar: [4, 3, 20] },
  { id: 8, name: "茨城県", kana: "いばらきけん", region: "関東地方", capital: "水戸市", hint: "納豆の生産やメロンが有名！", similar: [12, 9, 11] },
  { id: 9, name: "栃木県", kana: "とちぎけん", region: "関東地方", capital: "宇都宮市", hint: "日光東照宮や餃子が有名！", similar: [10, 11, 8] },
  { id: 10, name: "群馬県", kana: "ぐんまけん", region: "関東地方", capital: "前橋市", hint: "草津温泉やだるまが有名！", similar: [9, 11, 20] },
  { id: 11, name: "埼玉県", kana: "さいたまけん", region: "関東地方", capital: "さいたま市", hint: "草加せんべいや長瀞が有名！", similar: [10, 13, 9] },
  { id: 12, name: "千葉県", kana: "ちばけん", region: "関東地方", capital: "千葉市", hint: "東京ディズニーリゾートや落花生！", similar: [8, 14, 23] },
  { id: 13, name: "東京都", kana: "とうきょうと", region: "関東地方", capital: "新宿区", hint: "日本の首都でタワーやスカイツリー！", similar: [14, 11, 23] },
  { id: 14, name: "神奈川県", kana: "かながわけん", region: "関東地方", capital: "横浜市", hint: "横浜中華街や鎌倉の大仏！", similar: [12, 13, 23] },
  { id: 15, name: "新潟県", kana: "にいがたけん", region: "中部地方", capital: "新潟市", hint: "お米（コシヒカリ）の生産が日本一！", similar: [6, 16, 17] },
  { id: 16, name: "富山県", kana: "とやまけん", region: "中部地方", capital: "富山市", hint: "立山黒部アルペンルートやほたるいか！", similar: [17, 18, 19] },
  { id: 17, name: "石川県", kana: "いしかわけん", region: "中部地方", capital: "金沢市", hint: "兼六園や金箔、能登半島！", similar: [42, 16, 15] },
  { id: 18, name: "福井県", kana: "ふくいけん", region: "中部地方", capital: "福井市", hint: "恐竜の発掘や越前ガニ！", similar: [16, 25, 26] },
  { id: 19, name: "山梨県", kana: "やまなしけん", region: "中部地方", capital: "甲府市", hint: "富士山やぶどう・桃の生産！", similar: [16, 10, 20] },
  { id: 20, name: "長野県", kana: "ながのけん", region: "中部地方", capital: "長野市", hint: "日本アルプスやリンゴ・信州そば！", similar: [21, 7, 3] },
  { id: 21, name: "岐阜県", kana: "ぎふけん", region: "中部地方", capital: "岐阜市", hint: "白川郷の合掌造りや飛騨牛！", similar: [20, 25, 24] },
  { id: 22, name: "静岡県", kana: "しずおかけん", region: "中部地方", capital: "静岡市", hint: "お茶の生産量日本一や富士山！", similar: [23, 39, 30] },
  { id: 23, name: "愛知県", kana: "あいちけん", region: "中部地方", capital: "名古屋市", hint: "名古屋城や味噌カツ、自動車産業！", similar: [12, 14, 22] },
  { id: 24, name: "三重県", kana: "みえけん", region: "近畿地方", capital: "津市", hint: "伊勢神宮や松阪牛、松阪！", similar: [30, 21, 25] },
  { id: 25, name: "滋賀県", kana: "しがけん", region: "近畿地方", capital: "大津市", hint: "日本最大の湖「琵琶湖」！", similar: [29, 21, 18] },
  { id: 26, name: "京都府", kana: "きょうとふ", region: "近畿地方", capital: "京都市", hint: "金閣寺や清水寺など歴史的な街！", similar: [18, 28, 25] },
  { id: 27, name: "大阪府", kana: "おおさかふ", region: "近畿地方", capital: "大阪市", hint: "たこ焼きや道頓堀、大阪城！", similar: [37, 13, 14] },
  { id: 28, name: "兵庫県", kana: "ひょうごけん", region: "近畿地方", capital: "神戸市", hint: "姫路城や神戸牛、港町神戸！", similar: [35, 26, 38] },
  { id: 29, name: "奈良県", kana: "ならけん", region: "近畿地方", capital: "奈良市", hint: "奈良の大仏や東大寺のシカ！", similar: [25, 19, 9] },
  { id: 30, name: "和歌山県", kana: "わかやまけん", region: "近畿地方", capital: "和歌山市", hint: "みかんの生産量日本一や高野山！", similar: [39, 24, 22] },
  { id: 31, name: "鳥取県", kana: "とっとりけん", region: "中国地方", capital: "鳥取市", hint: "鳥取砂丘やすいかが有名！", similar: [32, 35, 18] },
  { id: 32, name: "島根県", kana: "しまねけん", region: "中国地方", capital: "松江市", hint: "出雲大社や宍道湖のしじみ！", similar: [31, 35, 15] },
  { id: 33, name: "岡山県", kana: "おかやまけん", region: "中国地方", capital: "岡山市", hint: "桃太郎の伝説やマスカット！", similar: [34, 28, 38] },
  { id: 34, name: "広島県", kana: "ひろしまけん", region: "中国地方", capital: "広島市", hint: "厳島神社の鳥居やお好み焼き！", similar: [33, 35, 38] },
  { id: 35, name: "山口県", kana: "やまぐちけん", region: "中国地方", capital: "山口市", hint: "フグ料理や角島大橋、秋吉台！", similar: [32, 31, 28] },
  { id: 36, name: "徳島県", kana: "とくしまけん", region: "四国地方", capital: "徳島市", hint: "阿波おどりやすだちが有名！", similar: [37, 39, 38] },
  { id: 37, name: "香川県", kana: "かがわけん", region: "四国地方", capital: "高松市", hint: "讃岐うどんが名物の「うどん県」！", similar: [27, 36, 38] },
  { id: 38, name: "愛媛県", kana: "えひめけん", region: "四国地方", capital: "松山市", hint: "みかんや道後温泉が有名！", similar: [39, 36, 34] },
  { id: 39, name: "高知県", kana: "こうちけん", region: "四国地方", capital: "高知市", hint: "坂本龍馬やカツオのたたき！", similar: [30, 22, 38] },
  { id: 40, name: "福岡県", kana: "ふくおかけん", region: "九州地方", capital: "福岡市", hint: "博多ラーメンや明太子！", similar: [41, 44, 43] },
  { id: 41, name: "佐賀県", kana: "さがけん", region: "九州地方", capital: "佐賀市", hint: "有田焼の陶磁器や吉野ヶ里遺跡！", similar: [40, 42, 43] },
  { id: 42, name: "長崎県", kana: "ながさきけん", region: "九州地方", capital: "長崎市", hint: "ハウステンボスやカステラ、島々！", similar: [17, 43, 41] },
  { id: 43, name: "熊本県", kana: "くまもとけん", region: "九州地方", capital: "熊本市", hint: "熊本城や阿蘇山、くまモン！", similar: [42, 46, 44] },
  { id: 44, name: "大分県", kana: "おおいたけん", region: "九州地方", capital: "大分市", hint: "別府温泉や由布院温泉！", similar: [45, 40, 43] },
  { id: 45, name: "宮崎県", kana: "みやざきけん", region: "九州地方", capital: "宮崎市", hint: "マンゴーやチキン南蛮、日向夏！", similar: [44, 46, 3] },
  { id: 46, name: "鹿児島県", kana: "かごしまけん", region: "九州地方", capital: "鹿児島市", hint: "桜島や黒豚、屋久島！", similar: [2, 23, 43] },
  { id: 47, name: "沖縄県", kana: "おきなわけん", region: "九州地方", capital: "那覇市", hint: "美ら海水族館や首里城、綺麗な海！", similar: [42, 13, 46] },
];

export const prefById = (id: number): Pref => PREFS[id - 1];
