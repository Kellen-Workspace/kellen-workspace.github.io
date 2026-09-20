/* 物种档案配置中心。新增物种时复制一个对象，并确保键名与 tree-data.js 中的节点 id 相同。 */
window.SERPENT_SPECIES={
  "python-bivittatus":{
    page:"taxa/python-bivittatus/",
    englishName:"Burmese python",
    summary:"大型无毒蟒类，适合用来观察蟒科的体型、斑纹、热感受结构以及缠绕捕食等特征。",
    profile:{
      "分类位置":"蟒科 · 蟒属",
      "通常体长":"约 3–5 米，个体差异显著",
      "毒性":"无毒，以缠绕方式制服猎物",
      "食性":"鸟类及多种哺乳动物",
      "栖息环境":"森林、湿地、草地及邻近水域",
      "活动节律":"因环境和季节而异",
      "繁殖方式":"卵生",
      "保护信息":"使用前请按最新版 IUCN 与当地法规核验"
    },
    identification:["身体粗壮，具有较大的深色块状斑纹","头部通常具有较清晰的箭头状纹样","眼鼻附近可观察到蟒类的热感受结构"],
    similar:["印度蟒 Python molurus","网纹蟒 Malayopython reticulatus"],
    distribution:{label:"南亚与东南亚部分地区",note:"红色区域为学习用概略范围，并非精确分布边界；引入分布地区未纳入。",polygons:[[[29,87],[28,96],[24,102],[22,108],[16,106],[9,100],[10,94],[18,89]]]},
    sources:[{label:"The Reptile Database",url:"https://reptile-database.reptarium.cz/species?genus=Python&species=bivittatus"}]
  },
  "boa-constrictor":{
    page:"taxa/boa-constrictor/",
    englishName:"Boa constrictor",
    summary:"分布于热带美洲的代表性蚺类。不同地理种群的体色、斑纹与体型存在差异，适合建立分地区的比较档案。",
    profile:{
      "分类位置":"蚺科 · 蚺属",
      "通常体长":"常见约 2–3 米，个体与种群差异明显",
      "毒性":"无毒，以缠绕方式制服猎物",
      "食性":"鸟类、哺乳动物及其他脊椎动物",
      "栖息环境":"热带森林、稀树草原及半干旱生境",
      "活动节律":"多在黄昏或夜间活动",
      "繁殖方式":"卵胎生",
      "保护信息":"使用前请按最新版评估与当地法规核验"
    },
    identification:["体侧常有鞍状斑纹","尾部斑纹通常比身体前部更鲜明","头部具有明显纵向深色纹"],
    similar:["帝王蚺 Boa imperator","彩虹蚺 Epicrates cenchria"],
    distribution:{label:"中美洲至南美洲的部分地区",note:"分类拆分会影响范围解释；地图仅表示广义学习范围。",polygons:[[[20,-104],[18,-86],[9,-78],[-5,-72],[-22,-60],[-36,-58],[-30,-70],[-10,-78],[8,-85]]]},
    sources:[{label:"The Reptile Database",url:"https://reptile-database.reptarium.cz/species?genus=Boa&species=constrictor"}]
  },
  "ophiophagus-hannah":{
    page:"taxa/ophiophagus-hannah/",
    englishName:"King cobra",
    summary:"以其他蛇类为主要猎物的大型前沟牙毒蛇。近年的分类研究提示传统广义眼镜王蛇可能包含多个演化支，记录地点尤其重要。",
    profile:{
      "分类位置":"眼镜蛇科 · 眼镜王蛇属",
      "通常体长":"常见约 3–4 米，少数个体更长",
      "毒性":"有毒，以神经毒作用为主",
      "食性":"主要捕食其他蛇类",
      "栖息环境":"森林、竹林、湿地边缘及农业景观",
      "活动节律":"多在白天活动，也受环境影响",
      "繁殖方式":"卵生，雌蛇具有筑巢与护巢行为",
      "保护信息":"分类与评估正在调整，需结合地点和最新版资料"
    },
    identification:["受威胁时可抬起身体前部并扩张颈部","枕部鳞片和头部比例可用于辅助鉴别","幼体常具有更加醒目的浅色横纹"],
    similar:["眼镜蛇属 Naja 的多个物种","其他眼镜王蛇属候选或新拆分物种"],
    distribution:{label:"南亚与东南亚的传统广义范围",note:"传统广义 Ophiophagus hannah 已涉及分类拆分，地图只能作为学习入口，物种记录应结合地点重新核验。",polygons:[[[28,78],[28,94],[24,104],[23,112],[10,118],[-6,106],[1,96],[10,90],[20,84]]]},
    sources:[{label:"The Reptile Database",url:"https://reptile-database.reptarium.cz/species?genus=Ophiophagus&species=hannah"}]
  },
  "lycodon-rufozonatus":{
    page:"taxa/lycodon-rufozonatus/",
    englishName:"Red-banded wolf snake",
    summary:"赤练蛇是游蛇科狼蛇属成员。醒目的红黑环带适合训练形态观察，但仅凭体色不足以可靠鉴别，记录地点、鳞片与完整身体纹样同样重要。",
    profile:{
      "分类位置":"游蛇科 · 狼蛇属",
      "体长信息":"个体和地区差异需结合可靠记录核验",
      "安全提示":"不要仅根据网页或体色判断危险性，也不要徒手接触",
      "食性记录":"鱼、蛙、蜥蜴、蛇、幼鸟及小型哺乳动物等",
      "栖息环境":"山地森林、山麓居民区、稻田及河岸环境等",
      "活动节律":"待结合地区与观察记录继续补充",
      "繁殖方式":"待补充可靠来源",
      "分类动态":"2025 年研究重新限定了本种及近似种的边界"
    },
    identification:["常见醒目的红色与深色横带，但颜色会受个体、年龄和照片光线影响","与近似种的可靠区分可能需要鳞片计数、地理位置和分子证据","照片记录应尽量包括头部、背部、腹部、尾部以及完整身体纹样"],
    similar:["Lycodon walli（2025 年提升为独立物种）","Lycodon duytan（2025 年描述的新种）","其他具有红黑或黄黑环带的狼蛇属成员"],
    distribution:{label:"中国大陆、台湾、朝鲜半岛、俄罗斯远东南部、对马岛及越南东北部",note:"依据 2025 年分类修订绘制的概略范围。红色区域不代表连续占据，也不能替代标本或权威分布数据。",polygons:[[[47,130],[43,142],[34,138],[24,122],[20,108],[24,99],[35,103],[42,116]]]},
    sources:[{label:"Nguyen、Poyarkov 与 Vogel（2025）分类修订",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC12455217/"},{label:"GBIF 物种记录",url:"https://www.gbif.org/species/5223677"}]
  }
};
