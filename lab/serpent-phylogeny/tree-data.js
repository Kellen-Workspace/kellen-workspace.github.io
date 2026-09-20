window.SERPENT_TREE={
  id:"serpentes",name:"蛇亚目",latin:"Serpentes",rank:"总览",type:"clade",note:"现生蛇类的总入口。第一版只保留适合学习的高阶主干，分支顺序不代表出现时间。",children:[
    {id:"blind-snakes",name:"盲蛇类群（传统）",latin:"Scolecophidia sensu lato",rank:"传统类群",type:"debated",status:"关系有争议",note:"穴居、体型细小、眼退化的蛇类集合。多项分子研究提示传统盲蛇类群可能不是单系群，因此这里作为学习分组展示。",children:[
      {id:"anomalepididae",name:"异盲蛇科",latin:"Anomalepididae",rank:"科",type:"family",note:"分布于中南美洲的小型穴居蛇类。"},
      {id:"leptotyphlopidae",name:"细盲蛇科",latin:"Leptotyphlopidae",rank:"科",type:"family",note:"俗称线蛇，通常以蚂蚁和白蚁为食。"},
      {id:"typhlopoidea",name:"盲蛇总科",latin:"Typhlopoidea",rank:"总科",type:"clade",note:"包含盲蛇科等若干高度穴居化支系。",children:[
        {id:"gerrhopilidae",name:"钩盲蛇科",latin:"Gerrhopilidae",rank:"科",type:"family",note:"主要分布于南亚与东南亚。"},
        {id:"typhlopidae",name:"盲蛇科",latin:"Typhlopidae",rank:"科",type:"family",note:"分布广泛，是盲蛇类群中物种较多的一支。"},
        {id:"xenotyphlopidae",name:"马达加斯加盲蛇科",latin:"Xenotyphlopidae",rank:"科",type:"family",note:"马达加斯加特有的小型支系。"}
      ]}
    ]},
    {id:"alethinophidia",name:"真蛇下目",latin:"Alethinophidia",rank:"下目",type:"clade",note:"除传统盲蛇类群之外的大多数现生蛇类，包含早期分化支系、大口蛇类和高级蛇类。",children:[
      {id:"aniliidae",name:"筒蛇科",latin:"Aniliidae",rank:"科",type:"family",note:"南美洲的早期分化真蛇支系，常作为理解真蛇早期演化的重要节点。"},
      {id:"tropidophiidae",name:"林蚺科",latin:"Tropidophiidae",rank:"科",type:"family",note:"主要分布于加勒比地区和美洲的中小型蛇类。"},
      {id:"uropeltoidea",name:"盾尾蛇总科",latin:"Uropeltoidea",rank:"总科",type:"clade",note:"以穴居生活和特化尾部为代表的一组真蛇。",children:[
        {id:"cylindrophiidae",name:"圆筒蛇科",latin:"Cylindrophiidae",rank:"科",type:"family",note:"东南亚穴居蛇类。"},
        {id:"uropeltidae",name:"盾尾蛇科",latin:"Uropeltidae",rank:"科",type:"family",note:"主要分布于印度与斯里兰卡，尾端常形成盾状结构。"}
      ]},
      {id:"macrostomata",name:"大口蛇类",latin:"Macrostomata",rank:"演化支",type:"clade",note:"以能够吞食相对大型猎物的颅骨和下颌适应为代表；内部高阶关系在不同研究中可能略有变化。",children:[
        {id:"pythonoidea",name:"蟒总科",latin:"Pythonoidea",rank:"总科",type:"clade",note:"包含蟒科及其近缘支系。",children:[
          {id:"pythonidae",name:"蟒科",latin:"Pythonidae",rank:"科",type:"family",note:"主要分布于旧大陆，许多种具有热感受结构。",children:[
            {id:"python-bivittatus",name:"缅甸蟒",latin:"Python bivittatus",rank:"种",type:"species",note:"大型蟒类示例节点，可直接在该节点照片文件夹中继续建立个人图像档案。"}
          ]}
        ]},
        {id:"booidea",name:"蚺总科",latin:"Booidea",rank:"总科",type:"clade",note:"包含蚺科及若干近缘支系。",children:[
          {id:"boidae",name:"蚺科",latin:"Boidae",rank:"科",type:"family",note:"主要分布于美洲，也有马达加斯加和太平洋岛屿支系。",children:[
            {id:"boa-constrictor",name:"红尾蚺",latin:"Boa constrictor",rank:"种",type:"species",note:"蚺科常见代表，可作为后续细分亚种或地理型的起点。"}
          ]}
        ]},
        {id:"caenophidia",name:"高级蛇类",latin:"Caenophidia",rank:"演化支",type:"clade",note:"现生蛇类物种多样性的主体，包含疣鳞蛇科及庞大的游蛇总科。",children:[
          {id:"acrochordidae",name:"疣鳞蛇科",latin:"Acrochordidae",rank:"科",type:"family",note:"高度水生化的高级蛇类早期分支。"},
          {id:"colubroidea",name:"游蛇总科",latin:"Colubroidea",rank:"总科",type:"clade",note:"包含蝰蛇、眼镜蛇、游蛇及多个相关科，是现生蛇类最大的辐射。",children:[
            {id:"viperidae",name:"蝰科",latin:"Viperidae",rank:"科",type:"family",note:"具有可折叠管状毒牙的毒蛇支系。",children:[
              {id:"viperinae",name:"蝰亚科",latin:"Viperinae",rank:"亚科",type:"clade",note:"主要分布于旧大陆，不具颊窝。"},
              {id:"crotalinae",name:"蝮亚科",latin:"Crotalinae",rank:"亚科",type:"clade",note:"多数成员具有颊窝热感受器。"}
            ]},
            {id:"pareidae",name:"钝头蛇科",latin:"Pareidae",rank:"科",type:"family",note:"多以蜗牛和蛞蝓为食，颌部常呈现左右不对称适应。"},
            {id:"homalopsidae",name:"水蛇科",latin:"Homalopsidae",rank:"科",type:"family",note:"主要分布于南亚、东南亚及澳洲的水生或半水生蛇类。"},
            {id:"elapoidea",name:"眼镜蛇类群",latin:"Elapoidea",rank:"演化支",type:"clade",status:"部分内部关系仍调整",note:"包含眼镜蛇科及多个非洲为主的相关支系。",children:[
              {id:"elapidae",name:"眼镜蛇科",latin:"Elapidae",rank:"科",type:"family",note:"以前沟牙为特征，包含眼镜蛇、环蛇、珊瑚蛇及海蛇。",children:[
                {id:"elapinae",name:"眼镜蛇亚科",latin:"Elapinae",rank:"亚科",type:"clade",note:"以陆生眼镜蛇、曼巴、环蛇和珊瑚蛇等为代表。",children:[
                  {id:"ophiophagus-hannah",name:"眼镜王蛇",latin:"Ophiophagus hannah",rank:"种",type:"species",note:"以其他蛇类为主要猎物的大型毒蛇，是建立物种照片档案的示例节点。"}
                ]},
                {id:"hydrophiinae",name:"海蛇亚科",latin:"Hydrophiinae",rank:"亚科",type:"clade",note:"包含澳洲陆生眼镜蛇类与真正海蛇，展示了显著的生态辐射。"}
              ]},
              {id:"lamprophiid-lineages",name:"闪鳞蛇类相关支系",latin:"Lamprophiid lineages",rank:"复合支系",type:"debated",status:"简化合并展示",note:"若干以非洲为中心的科级支系在不同分类方案中拆分程度不同，第一版暂不继续细分。"}
            ]},
            {id:"colubrid-lineages",name:"游蛇类群",latin:"Colubrid lineages",rank:"复合支系",type:"clade",note:"广义游蛇相关类群物种极多，第一版只保留几个学习入口。",children:[
              {id:"colubridae",name:"游蛇科",latin:"Colubridae",rank:"科",type:"family",note:"多样性极高，后续可按游蛇亚科等继续细分。"},
              {id:"natricidae",name:"水游蛇科",latin:"Natricidae",rank:"科",type:"family",note:"包含许多与水域环境关系密切的无毒或弱毒蛇类。"},
              {id:"dipsadidae",name:"新大陆水蛇科",latin:"Dipsadidae",rank:"科",type:"family",note:"以新大陆为中心、生态与形态高度多样的支系。"}
            ]}
          ]}
        ]}
      ]}
    ]}
  ]
};
