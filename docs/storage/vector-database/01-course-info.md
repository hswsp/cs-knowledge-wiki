---
source: https://www.yuque.com/yangguangfanxing/nmhuv1/epx2p7udbh53koga
---

# Course Info

> 原文链接：[https://www.yuque.com/yangguangfanxing/nmhuv1/epx2p7udbh53koga](https://www.yuque.com/yangguangfanxing/nmhuv1/epx2p7udbh53koga)

多伦多大学 [CSC2233 Topics in Storage Systems:Vector Databases in Modern AI Applications](https://www.cs.toronto.edu/~mgabel/csc2233/#projects)

Cutting-edge AI applications rely on custom storage systems that store billions of vectors, search through them quickly, and retrieve relevant results within milliseconds. Examples include LLM-based AI code assistants, image and video search, generative AI using retrieval-augmented generation (RAG), computational chemistry, protein folding, and recommender systems (e.g., TikTok, YouTube, Spotify). These applications embed data -- images, user preferences, or molecule structure -- as dense vectors, and then rely on fast search to find related vectors. The recent explosion of such AI applications has given rise to a new class of specialized storage system: the vector database, or VDBMS, which combines vector storage with semantic search over stored vectors.

This seminar-style course will introduce the key ideas and techniques used in this emerging class of storage systems, such as standard and hybrid querying, approximate nearest neighbour search, cluster and graph-based indexes, liveness layers, disk-resident indexing, and quantization. We will also discuss recent papers on updatable indexes, GPU-based indexing, multi-tenancy, VDBMS architecture, and more.

## Schedule and Slides

Click on links for the lecture slides.

| Week | Date | Content | Due |
| --- | --- | --- | --- |
| 1 | Jan 8 | [intro to VDBMS](https://www.cs.toronto.edu/~mgabel/csc2233/slides/1_-_Intro_What_is_a_Vector_DB.pdf) |  |
| 2 | Jan 15 | [querying](https://www.cs.toronto.edu/~mgabel/csc2233/slides/2_-_Querying.pdf) [basic indexing](https://www.cs.toronto.edu/~mgabel/csc2233/slides/3_-_Basic_Indexing.pdf) |  |
| 3 | Jan 22 | [advanced indexing](https://www.cs.toronto.edu/~mgabel/csc2233/slides/4_-_Advanced_indexing.pdf) + [segmenting](https://www.cs.toronto.edu/~mgabel/csc2233/slides/4b_-_Segmenting.pdf) ([video](https://play.library.utoronto.ca/watch/e5e426bc801a1e1a10c214a7e2b6491f)) [architectures](https://www.cs.toronto.edu/~mgabel/csc2233/slides/5_-_Architecture.pdf) | Paper and report bids due Jan 24 |
| 4 | Jan 29 | Student presentations: Incremental and disk-resident indexing [[Subramanya, NeurIPS'19]](https://docs.google.com/presentation/d/1xDQvHjsxWWccRa4vYfE-hGVDaBu_DSn1FMBwKO3iy4A/edit?usp=sharing) [[Singh, arXiv'21]](https://www.cs.toronto.edu/~mgabel/csc2233/students/FreshDiskANN_Yifang_Tian.pdf) |  |
| 5 | Feb 5 | Student presentations: Multitenancy and disaggregation [[Xu, SOSP'23]](https://docs.google.com/presentation/d/14zU1XJ6GhloVoQl7_ZSIqAg6HX0Uw1j4E4g77o3yXOc/edit?usp=sharing_eip&invite=CL_n4akC&ts=67a399a2&sh=t4flI8S_8Xwqxphs&ca=1&exids=71471469,71471463) [[Su, SIGMOD'24]](https://www.cs.toronto.edu/~mgabel/csc2233/students/vexless_slides.pdf) |  |
| 6 | Feb 12 | Student presentations: Filtered/hybrid queries [Gollapudi, WWW'23] [Zhang, OSDI'23] [[Cai, SIGMOD'24]](https://www.cs.toronto.edu/~mgabel/csc2233/students/LabelNavigatingGraph_final.pptx) [(slides source)](https://github.com/HomeletW/CSC2233-VDBMS-LNG-Presentation) | Project proposals due Feb 15 |
| Reading week |  |  |  |
| 7 | Feb 26 | Student presentations: GPUs in VDBMS [Johnson, Trans. Big Data '19] [Zhu, SIGMOD'24] |  |
| 8 | Mar 5 | Student presentations: Learning to index [[KDD'22]]([https://www.cs.toronto.edu/~mgabel/csc2233/students/BLISS](https://www.cs.toronto.edu/~mgabel/csc2233/students/BLISS) slides.pdf) [Li, KDD'23] [[Jääsaari, NeurIPS'24]](https://www.cs.toronto.edu/~mgabel/csc2233/students/LoRANN.pptx) |  |
| 9 | Mar 12 | Student presentations: SSDs in VDBMS [Huang, ICDE'24] [Wang, SIGMOD'24] | Mid-project report due Mar 14 |
| 10 | Mar 19 | Student presentations: Quantization and compression [[Ge et al., CVPR'13]](https://www.cs.toronto.edu/~mgabel/csc2233/students/csc2233_optimized_pq_slides.pdf) [Aguerrebere, VLDB'23] [Gao, SIGMOD'24] |  |
| 11 | Mar 26 | Student presentations: VDBMS architectures [Zhang, SIGMOD'24] [Wei, VLDB'20] [Chen, VLDB'24] |  |
| 12 | Apr 2 | Project showcase[!](https://www.youtube.com/watch?v=l8HInxDeC-o&t=10s) | Project report due Apr 4 |

## Paper List

Note that some papers focus on algorithms, some are more math-heavy, while others lean towards computer systems and architecture. A small number of papers might require deeper knowledge in systems or stronger understanding of machine learning. In the end, it falls to you to choose which paper to present and to fill-in any missing knowledge as you do so. It is a great opportunity to learn! However, regardless of how your paper leans, it will be your job as a presenter to make it accessible to the class.

Make sure to [List your paper preference](https://piazza.com/class/m4vtcawln643cc/post/11) in HotCRP by Jan 24.

Incremental disk-resident indexing:

- **[Subramanya, NeurIPS'19]** Suhas Jayaram Subramanya et al. [DiskANN : Fast Accurate Billion-point Nearest Neighbor Search on a Single Node](https://papers.nips.cc/paper_files/paper/2019/hash/09853c7fb1d3f8ee67a61b6bf4a7f8e6-Abstract.html). NeurIPS'19. **(DiskANN)**
- **[Singh, arXiv'21]** Aditi Singh et al. [FreshDiskANN: A Fast and Accurate Graph-Based ANN Index for Streaming Similarity Search](https://arxiv.org/abs/2105.09613). arXiv preprint arXiv:2105.09613 (2021). **(FreshDiskANN)**
- **[Xu, SOSP'23]** Yuming Xu et al. [SPFresh: Incremental In-Place Update for Billion-Scale Vector Search](https://dl.acm.org/doi/10.1145/3600006.3613166). SOSP'23. **(SPFresh)**

Multitenancy and disaggregation:

- **[ArXiv '24]** Yicheng Jin et al. [Curator: Efficient Indexing for Multi-Tenant Vector Databases](https://arxiv.org/abs/2401.07119). arXiv preprint arXiv:2401.07119 (2024) **(Curator)**
- **[Jang, ATC'23]** Junhyeok Jang et al. [CXL-ANNS: Software-Hardware Collaborative Memory Disaggregation and Computation for Billion-Scale Approximate Nearest Neighbor Search](https://www.usenix.org/conference/atc23/presentation/jang). USENIX ATC'23. **(CXL-ANNS)**
- **[Su, SIGMOD'24]** Yongye Su et al. [Vexless: A Serverless Vector Data Management System Using Cloud Functions](https://dl.acm.org/doi/10.1145/3654990). Proc. ACM Manag. Data 2, 3, Article 187 (June 2024). **(Vexless)**

Filtered/hybrid queries:

- **[Gollapudi, WWW'23]** Siddharth Gollapudi et al. [Filtered-DiskANN: Graph Algorithms for Approximate Nearest Neighbor Search with Filters](https://dl.acm.org/doi/10.1145/3543507.3583552). WWW'23. **(Filtered-DiskANN)**
- **[Zhang, OSDI'23]** Qianxi Zhang et al. [VBASE: Unifying Online Vector Similarity Search and Relational Queries via Relaxed Monotonicity](https://www.usenix.org/conference/osdi23/presentation/zhang-qianxi). OSDI'24. **(VBase)**
- **[Cai, SIGMOD'24]** Yuzheng Cai et al. [Navigating Labels and Vectors: A Unified Approach to Filtered Approximate Nearest Neighbor Search](https://dl.acm.org/doi/10.1145/3698822). Proc. ACM Manag. Data 2, 6, Article 246. **(UNG)**

GPUs in VDBMS:

- **[Johnson, Trans. Big Data '19]** Jeff Johnson et al. [Billion-Scale Similarity Search with GPUs](https://ieeexplore.ieee.org/document/8733051). IEEE Transactions on Big Data 7.3 (2019): 535-547.
- **[Gaihre, SC'21]** Anil Gaihre et al. [Dr. Top-k: delegate-centric Top-k on GPUs](https://dl.acm.org/doi/10.1145/3458817.3476141). SC'21. **(Dr. Top-k)**
- **[Zhu, SIGMOD'24]** Yifan Zhu et al. [GTS: GPU-based Tree Index for Fast Similarity Search](https://dl.acm.org/doi/10.1145/3654945). Proc. ACM Manag. Data 2, 3, Article 142. **(GTS)**

Learning to index:

- **[KDD'22]** Gaurav Gupta et al. [BLISS: A Billion scale Index using Iterative Re-partitioning](https://dl.acm.org/doi/10.1145/3534678.3539414). KDD'22. **(BLISS)**
- **[Li, KDD'23]** Wuchao Li et al. [Learning Balanced Tree Indexes for Large-Scale Vector Retrieval](https://dl.acm.org/doi/10.1145/3580305.3599406). KDD'23. **(BATL)**
- **[Jääsaari, NeurIPS'24]** Elias Jääsaari et al. [LoRANN: Low-Rank Matrix Factorization for Approximate Nearest Neighbor Search](https://arxiv.org/abs/2410.18926). NeurIPS'24 **(LoRANN)**

SSDs in VDBMS:

- **[Huang, ICDE'24]** Yuchen Huang, et al. [Neos: A NVMe-GPUs Direct Vector Service Buffer in User Space](https://ieeexplore.ieee.org/abstract/document/10598129). ICDE'24. **(Neos)**
- **[Wang, SIGMOD'24]** Mengzhao Wang et al. [Starling: An I/O-Efficient Disk-Resident Graph Index Framework for High-Dimensional Vector Similarity Search on Data Segment](https://dl.acm.org/doi/10.1145/3639269). Proc. ACM Manag. Data 2, 1, Article 14. **(Starling)**
- **[Tian, ATC'24]** Bing Tian et al. [Scalable Billion-point Approximate Nearest Neighbor Search Using SmartSSDs](https://www.usenix.org/conference/atc24/presentation/tian). USENIX ATC'24 **(SmartANNS)**

Quantization and compression:

- **[Ge et al., CVPR'13]** Tiezheng Ge et al. [Optimized Product Quantization for Approximate Nearest Neighbor Search](https://openaccess.thecvf.com/content_cvpr_2013/html/Ge_Optimized_Product_Quantization_2013_CVPR_paper.html). CVPR'13. **(OPQ)**
- **[Aguerrebere, VLDB'23]** Cecilia Aguerrebere et al. [Similarity Search in the Blink of an Eye with Compressed Indices](https://www.vldb.org/pvldb/vol16/p3433-aguerrebere.pdf). Proc. VLDB Endow. 16, 11. **(LVQ)**
- **[Gao, SIGMOD'24]** Jianyang Gao et al. [RaBitQ: Quantizing High-Dimensional Vectors with a Theoretical Error Bound for Approximate Nearest Neighbor Search](https://dl.acm.org/doi/10.1145/3654970). Proc. ACM Manag. Data 2, 3, Article 142. **(RaBitQ)**

VDBMS architectures:

- **[Zhang, SIGMOD'24]** Xinyi Zhang et al. [FedKNN: Secure Federated k-Nearest Neighbor Search](https://dl.acm.org/doi/10.1145/3639266). Proc. ACM Manag. Data 2, 1, Article 11. **(FedKNN, DANN)**
- **[Wei, VLDB'20]** Chuangxian Wei et al. [AnalyticDB-V: A Hybrid Analytical Engine Towards Query Fusion for Structured and Unstructured Data](http://www.vldb.org/pvldb/vol13/p3152-wei.pdf). Proc. VLDB Endow. 13, 12. **(AnalyticDB-V, ADBV)**
- **[Chen, VLDB'24]** Cheng Chen et al. [SingleStore-V: An Integrated Vector Database System in SingleStore](https://www.vldb.org/pvldb/vol17/p3772-chen.pdf). Proc. VLDB Endow. 17, 12. **(SingleStore-V)**

## Projects

You will [pair up](https://q.utoronto.ca/courses/386675/groups#tab-76542) to propose and pursue a small hands-on research project on vector databases. The goal is for you to gain experience doing such hands-on research, as well and synthesizing your results in written form. (Depending on factors, we may also do a small "workshop" during the final class where each group presents their work in a short six-minute presentation.)

Our TA, Pritish Mishra, will be available on [Fridays at 11am-12pm on Zoom](https://utoronto.zoom.us/j/86250419273) to provide some help on the project. He will also be *reviewing* the projects, so you should absolutely listen to him!

You are welcome to come up with your own project, or grab a [project idea from the list](https://piazza.com/class/m4vtcawln643cc/post/22).

#### Scope

The main requirement is that your project must involve some modest but (ideally) meaningful contribution to the field of vector databases or ANNS indexing. It could be trying out a new idea, extending a paper in the area, implement or benchmark and compare existing work, fresh analysis of common datasets, contribute theoretical insights and analysis, or provide some other constructive contribution. The project should focus on **quantitative methods**, such as algorithm design, various techniques, empirical evaluation of systems and algorithms, or mathematical modeling; something you can measure or prove.

The scope should be roughly about the size of a small systems workshop paper. You are welcome to tailor your project to align with your own research interests or background, or to make it more relevant and impactful. But it should be connected to vector databases.

#### Deliverables

To ensure steady progress on your project, we will ask you to submit three PDF deliverables through the term. The PDFs are submitted through [Quercus assignments](https://q.utoronto.ca/courses/386675/assignments), and any feedback on them will come back via Quercus as well.

**Format:** the PDF format **must** follow [the LaTeX template for USENIX papers](https://www.usenix.org/conferences/author-resources/paper-templates). As common in conferences, you should not change things like font sizes, line spacing, width or height of text area, etc. However for the proposal and progress report deliverables, you can omit the abstract. A common mistake is microscopic figures! Make sure your figures are readable without need to zoom-in too much. (Hint: if figure text is smaller than footnote text, this is probably too small.)

Note that using LaTeX is mandatory! Do **not** use Word, not even the Word template from USENIX. Using LaTeX is an [essential skill for CS grad students](https://guides.library.utoronto.ca/thesis/formatting_latex) and is a learning goal. Instead of using LaTeX locally you can use [Overleaf](https://www.overleaf.com/), which can make collaboration easier and requires no setup.

##### I. Proposal (due mid-Feb, exact date is in Quercus)

A concise document outlining your idea and execution plan (up to one page page). Explain in reasonable detail your idea, how you will pursue it, and how you will evaluate it. The proposed plan is not set in stone; it is perfectly OK (and even normal) that as you go with the project, you end up doing things differently than what you planned for. But you do need a plan! Do not forget to include a project title and the names of the authors (i.e., you names). The PDF should be **up to a single page** (with two columns of text) plus as many additional pages at the end as you need for references (bibliography). In other words, the referneces do not count in the page limit.

Guidance:

- When outlining your overall project idea, explain what you are planning to investigate, how it relates to previous work, whether it is a novel idea or extension of work, and how do you think it might benefit. Make it clear whether you are reproducing previous work or trying your own ideas. An important part is conducting a small literature review to make sure your idea is not identical to something that was already done. What are the most relevant existing works in the area?
- For your plan, you should explain the steps you plan to take to implement and test your idea for the project. Be reasonably specific; "(1) design, (2) implementation, (3) evaluation" is not a plan. What planning needs to be done? What exactly will you implement, what language, and how long do you think it will take? (Hint: you only have a few weeks and need to reserve time for experimentation and writing.) On what hardware will you run your experiments, and do you have access to the necessary hardware? What datasets will you use? Are you sure you will finish on time on the hardware you have? (Hint: if you plan indexing SIFT1B on your laptop, this will not go well. Try SIFT1M).
- For evaluation, briefly detail what kind of experiments you want to run, what kind of variables you want to control, the metrics you will want to measure, and the outcomes you expect or hope to see. What are the research questions you might want to ask?

The best empirical work can often tell the entire story with a single winning figure. Think what would that figure look like for your project: suppose you have done all the work and everything is great, what is the figure you would like to show that will tell the whole story? What is its X axis? What is the Y axis? What kind of figure it is and what is drawn on it? What story does it tell a reader? You can even include dummy figures in your proposal.

##### II. Progress Report (due mid March)

A **2-page report** (two-column pages) plus unlimited references, mean to help you keep on track. Before writing it, think about your progress towards the goal. What have you accomplished so far? How well into the plan are you? What have you tried that worked, and what did not work? Has your plan changed, and if so how? What more needs to be done?

We suggest the report follow a similar format to the project plan in the proposal, but now including much more detail. If some parts are already done, you can mix in content (paragraphs, tables, figures, etc.) and later re-use this content for your final report. For some projects it might even make sense to include one or two things that did **not** work, and how you adapted your plan.

##### III. Final Report (due end of term):

A comprehensive write-up akin to a journal or conference submission **4-6 two-column pages**.

As guidance, the format should (in general) be roughly similar to an academic paper: a short abstract, an introduction section, related work section (you can also weave the related work into the introduction instead of its own section), a "methods" section (it can take different forms depending on the project), an evaluation section (detailing experiments, results, and analysis), and end with a "discussion" or conclusion paragraph summarizing and discussing the results in a high level and how you might continue the work if you could. To be clear, these are not hard rules -- for some projects it makes sense to tweak these sections. Feel free to include diagrams, figures, tables, and every type of content that would make sense to include. By the end of the project you would have read at least 5 papers, so you know what they look like.

#### Project Showcase (the final lecture):

The last class will be a project showcase, where every project group will present a short 5-minute talk about their project.

Each group will prepare and deliver (together or just one member) a 5-minute presentation. You should present what the project is about, what are you looking into, and what have you found. If the project is not quite finished yet, show what have you found *so far* and what you hope or expect to find. Note this is only 5 minutes and the time limit is very strict. This means there is not a lot of time to dig into details, so focus on the main idea and the main results. Leave the fine details for the final report.
