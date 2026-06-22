---
title: "通用解题模板"
description: "博弈类动态规划（Game Theory DP）是解决“双方轮流、最优决策、结果确定”问题的通用模板。下面是博弈DP的核心框架："
---

博弈类动态规划（Game Theory DP）是解决“双方轮流、最优决策、结果确定”问题的通用模板。下面是**博弈DP的核心框架**：

## 问题特征 
+ 两名玩家轮流操作
+ 完全信息（双方知道所有状态）
+ 无随机因素
+ 双方都采用最优策略
+ 通常问“先手是否必胜”或“最优得分差”

# 通用解题模板 
## 基本思路 
用 DP 表示**当前玩家****在某个状态下的最优结果**。核心是**Minimax思想**：当前玩家最大化自己的优势，对手则会最小化你的优势。

## 状态定义 
```c
dp[state] = 在state状态下，当前行动玩家相对于对手的最大净优势
           （可能是分数差、胜负值、或最优得分）
```

注意是当前回合执行动作的玩家，并非固定的某一方。

## 核心状态转移模式 
其实**博弈 DP = Policy Iteration + 零和对手 + 完美信息 + 表格法**。

1. **问题层面**：博弈 DP 是要在对抗环境中找到最优策略，这正是 RL 的核心问题。
2. **方法层面**：转态转移方程 `max( gain - dp[next] )`就是 Bellman 方程，而 Bellman 方程是 Policy Iteration 的理论基础。
3. **差异**：博弈 DP 是 RL 的**“理想简化版”**——它假设环境模型完全已知且确定，因此不需要像通用 RL 那样通过采样来学习模型。

### 模式A：零和博弈（分数差） 
```rust
// 当前玩家得分为正，对手得分为负
// dp[state] = max(gain1 - dp[next_state1], gain2 - dp[next_state2], ...)
fn zero_sum_game(nums: &[i32]) -> i32 {
    let n = nums.len();
    let mut dp = vec![vec![0; n]; n];

    for i in 0..n {
        dp[i][i] = nums[i];
    }
// 对角遍历
    for len in 2..=n {
        for i in 0..=n - len {
            let j = i + len - 1;
            // 对手会在下一局最大化他的优势
            // nums[i] - dp[i + 1][j]：取左边元素的得分情况
            // nums[j] - dp[i][j - 1]：取右边元素的得分情况
            dp[i][j] = (nums[i] - dp[i + 1][j]).max(nums[j] - dp[i][j - 1]);
        }
    }

    dp[0][n - 1]
}
```

### 模式B：胜负判定（布尔DP） 
如果**存在**一个 `next_state`使得 `dp[next_state]`为 `False`（即对手必败），那么当前玩家必胜。

```rust
// dp[state] = 当前玩家是否必胜
// dp[state] = any(!dp[next_state] for next_state in next_states)
fn can_win_boolean(state: i32, memo: &mut HashMap<i32, bool>, max_pick: i32) -> bool {
    if state <= 0 {
        return false;
    }

    if let Some(&result) = memo.get(&state) {
        return result;
    }

    for i in 1..=max_pick {
        if i <= state && !can_win_boolean(state - i, memo, max_pick) {
            memo.insert(state, true);
            return true;
        }
    }

    memo.insert(state, false);
    false
}
```

### 模式C：最大得分 
```rust
// dp[state] = 当前玩家能获得的最大总分数
// dp[state][player] = 当前玩家能获得的最大得分
fn max_score_game(nums: Vec<i32>) -> i32 {
    let n = nums.len();
    // dp[i][j][0] 表示Alice在[i,j]区间的最大得分
    // dp[i][j][1] 表示Bob在[i,j]区间的最大得分
    let mut dp = vec![vec![vec![0; 2]; n]; n];

    for i in 0..n {
        dp[i][i][0] = nums[i];  // Alice先手
        dp[i][i][1] = 0;         // Bob得0分
    }

    for len in 2..=n {
        for i in 0..=n - len {
            let j = i + len - 1;

            // Alice的回合：最大化自己的得分
            // dp[i + 1][j][1]：在剩下的区间 [i+1, j] 中，Bob 的得分
            let alice_left = nums[i] + dp[i + 1][j][1];  // Alice取左，剩下给Bob
            let alice_right = nums[j] + dp[i][j - 1][1]; // Alice取右

            if alice_left > alice_right {
                dp[i][j][0] = alice_left;
                dp[i][j][1] = dp[i + 1][j][0];  // Bob在剩下区间先手
            } else {
                dp[i][j][0] = alice_right;
                dp[i][j][1] = dp[i][j - 1][0];
            }
        }
    }

    dp[0][n - 1][0]
}
```

## 记忆技巧 
1. **当前视角**：`dp[state]`永远表示**当前行动玩家**的优劣
2. **对手思维**：下一状态是**对手先手**，所以用 `-`或 `not`
3. **计算顺序**：区间DP通常从小区间到大区间
4. **胜负转换**：`dp[state] = not all(dp[next_state])`

这个模板覆盖了LeetCode中大部分博弈DP问题，掌握后能解决90%的相关题目。

## 常见博弈DP类型 
### 类型一：区间博弈DP
#### 预测赢家 LeetCode 486
给你一个整数数组 `nums` 。玩家 1 和玩家 2 基于这个数组设计了一个游戏。

玩家 1 和玩家 2 轮流进行自己的回合，玩家 1 先手。开始时，两个玩家的初始分值都是 `0` 。每一回合，玩家从数组的任意一端取一个数字（即，`nums[0]` 或 `nums[nums.length - 1]`），取到的数字将会从数组中移除（数组长度减 `1` ）。玩家选中的数字将会加到他的得分上。当数组中没有剩余数字可取时，游戏结束。

如果玩家 1 能成为赢家，返回 `true` 。如果两个玩家得分相等，同样认为玩家 1 是游戏的赢家，也返回 `true` 。你可以假设每个玩家的玩法都会使他的分数最大化。

```rust
// 预测赢家（LeetCode 486）
pub fn predict_the_winner(nums: Vec<i32>) -> bool {
    let n = nums.len();
    let mut dp = vec![vec![0; n]; n];

    for i in 0..n {
        dp[i][i] = nums[i];
    }

    for len in 2..=n {
        for i in 0..=n - len {
            let j = i + len - 1;
            dp[i][j] = (nums[i] - dp[i + 1][j]).max(nums[j] - dp[i][j - 1]);
        }
    }

    dp[0][n - 1] >= 0
}
```

c++ 代码：

```cpp
class Solution {
public:
bool predictTheWinner(vector<int>& nums) {
    int n = nums.size();
    vector<vector<int>>dp(n, vector<int>(n, 0));
    for (int i = 0; i < n; ++i) {
        dp[i][i] = nums[i];
    }
    for(int len = 1; len<n; ++len){
        for(int i=0;i< n - len;++i){
            int j = i + len;
            dp[i][j] = max(nums[i] - dp[i+1][j],nums[j] - dp[i][j-1]);
        }
    }
    return dp[0][n-1] >= 0;
}
};
```

#### 石子游戏类（区间DP） 
[LeetCode 877](https://leetcode.cn/problems/stone-game/description/)

亚历克斯和李用几堆石子在做游戏。

偶数堆石子排成一行，每堆都有正整数颗石子 `piles[i]`。

游戏以谁手中的石子最多来决出胜负，石子的总数是奇数，所以没有平局。

亚历克斯和李轮流进行，亚历克斯先开始。 每回合，玩家从行的开始或结束处取走整堆石头。这种情况一直持续到没有更多的石子堆为止，此时手中石子最多的玩家获胜。

假设亚历克斯和李都发挥出最佳水平，当亚历克斯赢得比赛时返回 `true`，当李赢得比赛时返回 `false`。

示例：

```plain
输入：[5,3,4,5]

输出：true

解释：
亚历克斯先开始，只能拿前 5 颗或后 5 颗石子 。
假设他取了前 5 颗，这一行就变成了 [3,4,5] 。
如果李拿走前 3 颗，那么剩下的是 [4,5]，亚历克斯拿走后 5 颗赢得 10 分。
如果李拿走后 5 颗，那么剩下的是 [3,4]，亚历克斯拿走后 4 颗赢得 9 分。
这表明，取前 5 颗石子对亚历克斯来说是一个胜利的举动，所以我们返回 true 。
```

提示：

+ `piles.length` 是偶数
+ `sum(piles)` 是奇数

**状态**：`dp[i][j]`表示在区间 `[i,j]`上，**当前玩家**能获得的最大净胜分。

```rust
// 类型一：区间博弈DP（石子游戏/预测赢家）
pub fn stone_game(piles: Vec<i32>) -> bool {
    let n = piles.len();
    // dp[i][j] 表示在区间 [i,j] 上，当前玩家能获得的最大净胜分
    let mut dp = vec![vec![0; n]; n];

    // 初始化：只剩一堆时
    for i in 0..n {
        dp[i][i] = piles[i];
    }

    // 倒序枚举区间
    for len in 2..=n {  // 区间长度
        for i in 0..=n - len {
            let j = i + len - 1;
            // 当前玩家可以选择左端或右端
            dp[i][j] = (piles[i] - dp[i + 1][j])  // 取左端，对手在 [i+1,j] 先手
                .max(piles[j] - dp[i][j - 1]);    // 取右端，对手在 [i,j-1] 先手
        }
    }

    dp[0][n - 1] > 0
}
```

##### 数学结论
> 参考 [https://mp.weixin.qq.com/s/j4DK-RvervumKVcLR5tcBw](https://mp.weixin.qq.com/s/j4DK-RvervumKVcLR5tcBw)
>

事实上，这还是一道很经典的博弈论问题，也是最简单的一类博弈论问题。

由于题目限制了**堆数为偶数**且**总数为奇数**，先手 Alice **必胜**。

**推理逻辑**：将石子堆按奇偶下标分组（第1、3、5...堆 vs 第2、4、6...堆）。Alice 可以通过先手选择，**完全控制**自己只拿其中某一组的石子。由于总数是奇数，两组石子总数必不相等，Alice 只需选择总数更大的那一组策略，即可确保获胜。

为了方便，我们称「石子序列」为石子在原排序中的编号，下标从 1  开始。

由于石子的堆数为偶数，且只能从两端取石子。**因此先手后手所能选择的石子序列，完全取决于先手每一次决定。**

由于石子的堆数为偶数，对于先手而言：**每一次的决策局面，都能「自由地」选择奇数还是偶数的序列，从而限制后手下一次「只能」奇数还是偶数石子。**

具体的，对于本题，**由于石子堆数为偶数，因此先手的最开始局面必然是 奇数偶数，即必然是「奇偶性不同的局面」；当先手决策完之后，交到给后手的要么是 奇数奇数 或者 偶数偶数，即必然是「奇偶性相同的局面」；后手决策完后，又恢复「奇偶性不同的局面」交回到先手** ...

不难归纳推理，这个边界是可以应用到每一个回合。

**因此先手只需要在进行第一次操作前计算原序列中「奇数总和」和「偶数总和」哪个大，然后每一次决策都「限制」对方只能选择「最优奇偶性序列」的对立面即可。**

同时又由于所有石子总和为奇数，堆数为偶数，即没有平局，所以先手必胜。

Java 代码：

```java
class Solution {
    public boolean stoneGame(int[] piles) {
        return true;
    }
}
```

C++ 代码：

```cpp
class Solution {
public:
bool stoneGame(vector<int>& piles) {
    return true;
}
};
```

Python 代码：

```python
class Solution:
    def stoneGame(self, piles: List[int]) -> bool:
        return True
```

+ 时间复杂度：$O(1)$
+ 空间复杂度：$O(1)$

**优先掌握区间 DP 的思路**，因为面试官可能会追问“如果堆数可以是奇数怎么办”。

### 类型二：取石子变种（记忆化搜索） 
**状态**：`dp[n]`表示剩下 `n`个石子时，当前玩家的胜负。

```rust
use std::collections::HashMap;

// 类型二：取石子变种（记忆化搜索）
pub fn can_win_nim(n: i32) -> bool {
    // 基础Nim游戏
    n % 4 != 0
}

// 通用记忆化搜索模板
pub struct GameSolver {
    memo: HashMap<u32, bool>,  // 状态 -> 是否必胜
}

impl GameSolver {
    pub fn new() -> Self {
        Self {
            memo: HashMap::new(),
        }
    }

    // 状态定义：dp[state] = 当前玩家是否必胜
    pub fn can_win(&mut self, state: u32, moves: &[u32]) -> bool {
        if state == 0 {
            return false;  // 无牌可出，当前玩家必败
        }

        if let Some(&result) = self.memo.get(&state) {
            return result;
        }

        // 尝试所有可能的操作
        for &move_val in moves {
            if move_val <= state {
                let next_state = state - move_val;
                if !self.can_win(next_state, moves) {  // 对手必败
                    self.memo.insert(state, true);
                    return true;
                }
            }
        }

        self.memo.insert(state, false);
        false
    }
}

// LeetCode 292: Nim游戏
pub fn nim_game(n: i32, moves: Vec<i32>) -> bool {
    // moves: 每次可以取的石子数
    let mut solver = GameSolver::new();
    solver.can_win(n as u32, &moves.iter().map(|&x| x as u32).collect::<Vec<_>>())
}
```

### 类型三：Nim游戏类（SG函数） 
**SG定理**：游戏和 = 各子游戏 SG 值的异或和。

```rust
use std::collections::HashSet;

// 最小排除自然数函数
fn mex(values: &HashSet<i32>) -> i32 {
    let mut i = 0;
    while values.contains(&i) {
        i += 1;
    }
    i
}

// SG函数求解器
pub struct SGCalculator {
    memo: HashMap<i32, i32>,  // 状态 -> SG值
    moves: Vec<i32>,          // 可能的操作
}

impl SGCalculator {
    pub fn new(moves: Vec<i32>) -> Self {
        Self {
            memo: HashMap::new(),
            moves,
        }
    }

    // 计算状态的SG值
    pub fn sg(&mut self, state: i32) -> i32 {
        if state == 0 {
            return 0;  // 终态SG值为0
        }

        if let Some(&sg_value) = self.memo.get(&state) {
            return sg_value;
        }

        let mut next_sg_values = HashSet::new();

        // 所有可能的下一状态
        for &move_val in &self.moves {
            if move_val <= state {
                let next_state = state - move_val;
                next_sg_values.insert(self.sg(next_state));
            }
        }

        let sg_value = mex(&next_sg_values);
        self.memo.insert(state, sg_value);
        sg_value
    }

    // 多堆Nim游戏判断先手是否必胜
    pub fn can_win_nim_multiple(&mut self, piles: Vec<i32>) -> bool {
        let mut xor_sum = 0;
        for &pile in &piles {
            xor_sum ^= self.sg(pile);
        }
        xor_sum != 0
    }
}
```

### 模板四：零和博弈（得分差DP）
```rust
// 更通用的零和博弈模板
pub fn zero_sum_game(nums: &[i32]) -> i32 {
    let n = nums.len();
    let mut dp = vec![vec![0; n]; n];
    
    for i in 0..n {
        dp[i][i] = nums[i];
    }
    
    for len in 2..=n {
        for i in 0..=n - len {
            let j = i + len - 1;
            // 当前玩家最大化(当前得分 - 对手下一局最优)
            dp[i][j] = (nums[i] - dp[i + 1][j]).max(nums[j] - dp[i][j - 1]);
        }
    }
    
    dp[0][n - 1]
}
```

### 经典例题对应模板 
| 题目类型 | 状态定义 | 转移方程 | 例题 |
| --- | --- | --- | --- |
| 区间取石子 | `dp[i][j]`净胜分 | `max(piles[i]-dp[i+1][j], piles[j]-dp[i][j-1])` | LeetCode 877, 486 |
| 取石子变种 | `dp[n]`是否必胜 | `any(not dp[n-move] for move in moves)` | LeetCode 292 |
| 多堆Nim | SG值异或 | `xor(sg(pile)) != 0` | LeetCode 292, 464 |
| 预测赢家 | `dp[i][j]`净胜分 | 同上区间DP | LeetCode 486 |
| 硬币游戏 | `dp[i]`当前玩家最大净胜 | `max(pick - dp[i+1], ...)` | LeetCode 1140 |


## 博弈论泛化：强化学习
博弈论 DP 和强化学习（Policy Iteration）本质上是**同一套数学框架在不同视角下的应用**。

我们可以把博弈 DP 看作是**两人零和、完全信息、确定性环境下的 Policy Iteration**: [Lecture 7: Value-Based RL](https://www.yuque.com/yangguangfanxing/ql9baa/cb57f171999307e08321c64d795c4a0f)

| **概念** | **博弈论 DP (如石子游戏)** | **强化学习 (Policy Iteration)** | **对应关系** |
| :--- | :--- | :--- | :--- |
| **状态 (State)** | 当前局面 (如石子数 `n`或区间 `[i, j]`) | 环境状态 $s_t$ | 完全对应 |
| **动作 (Action)** | 玩家可选的决策 (如取 1/2/3 颗石子) | 智能体的动作 $a_t$ | 完全对应 |
| **价值函数 (Value)** | `dp[state]`(净胜分或必胜性) | $V^{\pi}(s)$或 $Q^{\pi}(s,a)$ | **核心等价** |
| **策略 (Policy)** | 玩家的决策规则 (如“取中间石子”) | $\pi (a\mid s)$ | 都是找最优策略 |
| **更新规则** | `dp[i] = max( gain - dp[i+1] )` | $V(s)\leftarrow max_a[R(s,a)+\gamma V(s')]$ | **Bellman 方程的不同形式** |


#### 特殊性与通用性 
| 特性 | 博弈论 DP | 通用 RL (Policy Iteration) |
| --- | --- | --- |
| **模型已知** | ✅ 完全已知 (如石子规则固定) | ❌ 通常未知 (需探索) |
| **状态空间** | 小且离散 (可用数组存储) | 可能连续/高维 (需神经网络) |
| **对手** | 明确的对手 (Minimax) | 环境 (Environment) |
| **目标** | 找到必胜策略 | 最大化累计奖励 |


**结论**：博弈 DP 是 RL 在**完美信息、确定性环境、小状态空间**下的一个特例。

#### 数学本质：Bellman 方程 
博弈 DP 的状态转移：

```plain
dp[i][j] = max(
    nums[i] - dp[i+1][j],   // 取左端
    nums[j] - dp[i][j-1]    // 取右端
);
```

这正是**两人零和博弈下的 Bellman 最优方程**。其中：

+ `nums[i]`对应**即时奖励**$R(s,a)$
+ `- dp[i+1][j]`对应**折扣后的下一状态价值**$\gamma V(s')$，只不过在零和博弈中，对手的收益是你的损失，所以是负号。

#### 算法过程：隐式的 Policy Iteration 
当你写博弈 DP 时，你其实在手动执行 Policy Iteration：

+ **策略评估 (Policy Evaluation)**：当你初始化 `dp`数组并开始循环时，你就是在计算当前策略（“总是取最优动作”）下的价值。
+ **策略改进 (Policy Improvement)**：在 `max()`函数中，你选择了能最大化当前收益的动作，这本身就是**策略改进定理**的应用。

---

#### 具体代码对比 
博弈 DP (Rust 风格) 

```rust
// 状态：石子数 n
// 价值：dp[n] 表示先手是否必胜
fn can_win(n: i32, memo: &mut HashMap<i32, bool>) -> bool {
    if n <= 0 { return false; }
    if let Some(&res) = memo.get(&n) { return res; }

    // 策略改进：尝试所有动作，看是否存在让对手必败的动作
    let result = [1, 2, 3].iter()
        .any(|&take| take <= n && !can_win(n - take, memo));

    memo.insert(n, result);
    result
}
```

Policy Iteration (伪代码) 

```python
def policy_iteration():
    # 1. 策略评估：计算当前策略的价值 V(s)
    while not converged:
        for s in states:
            V(s) = R(s, π(s)) + γ * V(next_state(s, π(s)))

    # 2. 策略改进：贪心地选择最优动作
    for s in states:
        π_new(s) = argmax_a [ R(s, a) + γ * V(next_state(s, a)) ]
```

**你会发现**：博弈 DP 的递归调用 `!can_win(n - take)`实际上同时完成了**评估**（计算胜负）和**改进**（选择 `any`动作）两步。

---

## 解题步骤模板
```rust
fn game_theory_dp_template(piles: &[i32]) -> bool {
    // 1. 定义状态
    let n = piles.len();
    let mut dp = vec![vec![0; n]; n];
    
    // 2. 初始化边界
    for i in 0..n {
        dp[i][i] = piles[i];  // 只剩一个时，当前玩家全拿
    }
    
    // 3. 状态转移（注意计算顺序）
    for len in 2..=n {  // 区间长度从2到n
        for i in 0..=n - len {  // 左端点
            let j = i + len - 1;  // 右端点
            
            // 关键：当前玩家的选择 - 下一状态对手的最优
            let take_left = piles[i] - dp[i + 1][j];
            let take_right = piles[j] - dp[i][j - 1];
            
            dp[i][j] = take_left.max(take_right);
        }
    }
    
    // 4. 判断结果
    dp[0][n - 1] >= 0
}
```

## 更多博弈问题示例 
### 示例1：取硬币游戏 
硬币游戏（LeetCode 1140）

```rust
// LeetCode 1140 石子游戏 II
pub fn stone_game_ii(piles: Vec<i32>) -> i32 {
    let n = piles.len();
    let mut suffix_sum = vec![0; n + 1];

    // 后缀和
    for i in (0..n).rev() {
        suffix_sum[i] = suffix_sum[i + 1] + piles[i];
    }

    // dp[i][m]: 从位置i开始，M=m时，当前玩家能获得的最大石子数
    let mut dp = vec![vec![0; n + 1]; n + 1];

    for i in (0..n).rev() {
        for m in 1..=n {
            if i + 2 * m >= n {
                dp[i][m] = suffix_sum[i];
            } else {
                for x in 1..=2*m {
                    dp[i][m] = dp[i][m].max(
                        suffix_sum[i] - dp[i + x][m.max(x)]
                    );
                }
            }
        }
    }

    dp[0][1]
}
```

### 示例2：记忆化搜索模板 
我能赢吗？（LeetCode 464）

```rust
use std::collections::HashMap;

pub fn can_win(state: i32, memo: &mut HashMap<i32, bool>) -> bool {
    if state == 0 {
        return false;
    }

    if let Some(&result) = memo.get(&state) {
        return result;
    }

    // 尝试所有可能的操作
    for i in 1..=3 {  // 假设每次可以取1-3
        if i <= state {
            if !can_win(state - i, memo) {
                memo.insert(state, true);
                return true;
            }
        }
    }

    memo.insert(state, false);
    false
}
```

### 关键要点（Rust实现） 
1. **状态定义**：通常用 `dp[i][j]`或 `dp[mask]`
2. **记忆化**：使用 `HashMap`或数组缓存
3. **位运算**：对于状态压缩，使用 `u32`或 `i32`的位操作
4. **遍历顺序**：区间DP从小区间到大区间
5. **所有权**：注意Rust的所有权规则，可能需要使用引用或克隆

### 测试用例 
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stone_game() {
        let piles = vec![5, 3, 4, 5];
        assert!(Solution::stone_game(piles));

        let piles2 = vec![3, 7, 2, 3];
        assert!(Solution::stone_game(piles2));
    }

    #[test]
    fn test_predict_winner() {
        let nums = vec![1, 5, 2];
        assert!(!predict_the_winner(nums));

        let nums2 = vec![1, 5, 233, 7];
        assert!(predict_the_winner(nums2));
    }

    #[test]
    fn test_nim_game() {
        assert!(can_win_nim(1));
        assert!(can_win_nim(2));
        assert!(can_win_nim(3));
        assert!(!can_win_nim(4));
    }
}
```

