---
title: 6.824 Lab 2 - Raft
description: "MIT 6.824 Lab 2 - Raft"
date: 2022-09-17
---

> **The source code of this Lab is [Here](https://github.com/hswsp/MIT-6.824/tree/main/Lab%202-Raft)**

# Background

Consensus algorithms are vital in large-scale, fault-tolerant systems because they enable a set of distributed/replicated machines or servers to work as a coherent group and agree on system state, even in the presence of failures or outages.

![Consensus algorithms are important in distributed computing systems.](https://cdn.ttgtmedia.com/rms/onlineImages/networking-distributed_computing.jpg)

There are basically two types of consensus algorithms: 

- Byzantine Fault Tolerance Consensus Algorithm 
- Non-byzantine Fault Tolerance Consensus Algorithm

**Byzantine Fault Tolerance**(BFT) is the feature of a distributed network to reach consensus(agreement on the same value) even when some of the nodes in the network fail to respond or respond with incorrect information. The objective of a BFT mechanism is to safeguard against the system failures by employing collective decision making(both – correct and faulty nodes) which aims to reduce to influence of the faulty nodes. BFT is derived from Byzantine Generals’ Problem.

The Byzantine Generals Problem is a game theory problem, which describes the difficulty decentralized parties have in arriving at consensus without relying on a trusted central party. Only decentralized systems face the Byzantine Generals problem, as they have no reliable source of information and no way of verifying the information they receive from other members of the network. The problem was explained aptly in [a paper by LESLIE LAMPORT, ROBERT SHOSTAK, and MARSHALL PEASE at Microsoft Research in 1982](https://lamport.azurewebsites.net/pubs/byz.pdf).

![byzantine-generals-problem](https://river.com/learn/images/articles/byzantine-generals-problem.png)

So what I want to emphasize is that the Byzantine Generals problem describes the most difficult and complex distributed fault scenario. In addition to faulty behavior, there is also a scenario of malicious behavior. In the presence of malicious node behavior (such as in the blockchain technology of digital currencies), we must apply **Byzantine Fault Tolerance**.

Leslie Lamport constructed two solutions to the Byzantine Generals Problem: 

- A SOLUTION WITH ORAL MESSAGES 
- A SOLUTION WITH SIGNED MESSAGES

Besides, other commonly used BFT includes: 

- PBFT(practical Byzantine Fault Tolerance)
- PoW(Proof-of-Work).

While in a distributed computing system, the most commonly used non-Byzantine fault-tolerant algorithm is **Crash Fault Tolerance** (CFT). CFT solves the consensus problem in the scenario where there is a fault in the distributed system, but no malicious node.

The commonly used CFT includes:

- [Paxos algorithm](https://martinfowler.com/articles/patterns-of-distributed-systems/paxos.html)

- Multi-Paxos

- [Zab protocol](https://marcoserafini.github.io/papers/zab.pdf)

- [gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol#:~:text=A%20gossip%20protocol%20or%20epidemic,all%20members%20of%20a%20group.)

- [Qourum NWR](https://blog.birost.com/a?ID=00550-5be6c52e-30ff-4c27-9137-aa026180578a)

Raft produces a result equivalent to (multi-)Paxos, and it is as efﬁcient as Paxos. In this lab we'll implement Raft, a replicated state machine protocol. 

# Introduction

We should follow the design in the [extended Raft paper](https://pdos.csail.mit.edu/6.824/papers/raft-extended.pdf), with particular attention to Figure 2. We'll implement most of what's in the paper, including saving persistent state and reading it after a node fails and then restarts. We will not implement cluster membership changes (Section 6).

We may find this [guide](https://thesquareplanet.com/blog/students-guide-to-raft/) useful, as well as this advice about [locking](https://pdos.csail.mit.edu/6.824/labs/raft-locking.txt) and [structure](https://pdos.csail.mit.edu/6.824/labs/raft-structure.txt) for concurrency.  

To help us to understand Raft algorithm, this [working draft](http://thesecretlivesofdata.com/raft/) visualize the data flow of consensus algorithm and especially Raft algorithm.

Raft decomposes the consensus problem into three relatively independent subproblems: **Leader Election, Log Replication in the state machine, and Cluster Membership Changes**. In this lab, we will only implement the first two parts, with two other essential techniques for Raft practice: **Persistence and Log Compaction**.

## Lab Code Structure

A service calls `Make(peers,me,…)` to create a Raft peer.  the ports of all the Raft servers (including this one) are in `peers[]`. this server's port is `peers[me]`. all the servers' `peers[]` arrays have the same order. `persister` is a place for this server to save its persistent state, and also initially holds the most  recent saved state, if any.  `Make()` must return quickly, so it should start goroutines for any long-running work.

`applyCh` is a channel on which the tester or service expects Raft to send `ApplyMsg` messages. The service expects your implementation to send an `ApplyMsg` for each newly committed log entry to the `applyCh` channel argument to `Make()`. you'll want to send two kinds of messages to the service (or tester) on the same server: command and snapshots. set `CommandValid` to `true` to indicate that the `ApplyMsg` contains a newly committed log entry and set `CommandValid` to `false` for snapshots.

`Start(command interface{})` asks Raft to start the processing to append the command to the replicated log. `Start()` should return immediately, without waiting for the log appends to complete. 

```go
// create a new Raft server instance:
rf := Make(peers, me, persister, applyCh)

// start agreement on a new log entry:
rf.Start(command interface{}) (index, term, isleader)

// ask a Raft for its current term, and whether it thinks it is leader
rf.GetState() (term, isLeader)

// each time a new entry is committed to the log, each Raft peer
// should send an ApplyMsg to the service (or tester).
type ApplyMsg
```

this lab has also provided a diagram of Raft interactions that can help clarify how your Raft code interacts with the layers on top of it:

![lab2 Raft interactions](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft-server.png)

Combining the interactions diagram and test code, we can see how our Raft code works as a whole:

The test functions call `func make_config(t *testing.T, n int, unreliable bool, snapshot bool) *config` to create a raft service, in which, it calls `Make(peers,me,…)`. 

The service calls `func (cfg *config) one(cmd interface{}, expectedServers int, retry bool) int` to do a complete agreement, in which, it calls `rf.Start(cmd)` to append the command to the replicated log.

## Logging 

In order to debug distributed systems, We will make Go print a boring log with a specific format for each peer service. Here I use [go-hclog](https://github.com/hashicorp/go-hclog) as the logger to output formatted log in a file for each peer. **It prints the message along with the topic and the amount of milliseconds since the start of the run**.

```go
func FileConfig(file io.Writer) Config {
	id := generateUUID()
	return Config{
		HeartbeatTimeout:   100 * time.Millisecond,
		ElectionTimeout:    200 * time.Millisecond,
		CommitTimeout:      70 * time.Millisecond,
    // LeaseRead, LeaderLeaseTimeout<HeartbeatTimeout,
    // During the lease period, we can believe that other nodes must not initiate elections, 
    // and the cluster must not have split-brain, so we can directly read the master during this time period.
		LeaderLeaseTimeout: 100 * time.Millisecond, 
		LogLevel:           "DEBUG",
		LocalID:            ServerID(id),
		LogOutput:          file,
	}
}
```

```go
rf.logger = hclog.New(&hclog.LoggerOptions{
		Name:  fmt.Sprintf("my-raft-%d", me),
		Level: hclog.LevelFromString(rf.config().LogLevel),
		Output: rf.config().LogOutput,
	})
```

## Locking Advice

To avoid Livelocks, I use Golang `Atomic` as much as possible and fetch all the variables at the very beginning of each function. And try to use fine-grained lock instead of Coarse-Grained Lock (such as using  `sync.Mutex` to lock the whole function). And also copy-on-write technich when dealing with the Raft `logs`.

Besides, to prevent thread getting blocked, we can add time limit to Go Select Statement for asynchronous nofitication:

```go
// asyncNotifyCh is used to do an async channel send
// to a single channel without blocking.
func asyncNotifyCh(ch chan struct{}) {
	select {
	case ch <- struct{}{}:
	default:
	}
}
```

To aovid deadlock, we can prevent Deadlock by eliminating Circular wait condition: all of the functions request the resources in an increasing order of numbering. For example, `lastLock sync.Mutex` first and then `logsLock sync.RWMutex`.

# Data Structure Design

As for the general structure, the tables in Raft paper are very clear in Figure 2, and we only need to add some details.

## Server State

Firstly, we define some enum constants to represent the server node status:

```go
// RaftState captures the state of a Raft node: Follower, Candidate, Leader,
// or Shutdown.
type RaftState uint32
const (
	// Follower is the initial state of a Raft node.
	Follower RaftState = iota

	// Candidate is one of the valid states of a Raft node.
	Candidate

	// Leader is one of the valid states of a Raft node.
	Leader

	// Shutdown is the terminal state of a Raft node.
	Shutdown
)
```

To represent the state of all the servers, we define `raftState`  to maintain various state variables: 

![lab2 Raft State](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft1.png)

```go
// raftState is used to maintain various state variables
// and provides an interface to set/get the variables in a
// thread safe manner.
type raftState struct {
	// currentTerm commitIndex, lastLogIndex,  must be kept at the top of
	// the struct so they're 64 bit aligned which is a requirement for
	// atomic ops on 32 bit platforms.

	// The current term, cache of StableStore, start from 1
	currentTerm uint64

	// Highest committed log entry
	commitIndex uint64
	// Last applied log to the FSM
	lastApplied uint64

	// protects 4 next fields
	lastLock sync.Mutex

	// Cache the latest snapshot index/term
	lastSnapshotIndex uint64  //lastIncludedIndex
	lastSnapshotTerm  uint64  //lastIncludedTerm

	// Cache the latest log that in Persistent state (stored in FSM)
	lastLogIndex uint64
	lastLogTerm  uint64

	// Tracks running goroutines
	routinesGroup sync.WaitGroup

	// The current state
	state         RaftState

	//dedicated thread calling r.app.apply
	applyLogCh       chan struct{}

	// killCh is used to kill all go routines when state changes
	killCh           chan struct{}
}
```

In Go, one can use structs for inheritance.  For object-oriented programming, we can compose using `raftState`  to form our `Raft` peer struct:

```go
type Raft struct {
	raftState //OOP inherit

	mu        sync.Mutex          // Lock to protect shared access to this peer's state
	peers     []*labrpc.ClientEnd // RPC end points of all peers
	persister *Persister          // Object to hold this peer's persisted state
	me        int                 // this peer's index into peers[]
	dead      int32               // set by Kill()
	// Shutdown channel to exit, protected to prevent concurrent exits
	shutdownCh   chan struct{}
	shutdownLock sync.Mutex

	// Your data here (2A, 2B, 2C).
	// Look at the paper's Figure 2 for a description of what
	// state a Raft server must maintain.

	// persistent state on all servers
	//candidateID that received vote in current term
	votedFor int32
	//the current cluster leader ID
	leaderID int32
	leaderLock sync.RWMutex

	//each entry contains command for state machine
	// and term when entry was received by leader
	//we actually use logs[index-1] to fetch log with Index = index
	logs      []Log
	logsLock sync.RWMutex

	// volatile state on leaders
	// leaderState used only while state is leader
	leaderState LeaderState

	// conf stores the current configuration to use. This is the most recent one
	// provided. All reads of config values should use the config() helper method
	// to read this safely.
	conf atomic.Value

	// lastContact is the last time we had contact from the
	// leader node. This can be used to gauge staleness.
	lastContact     time.Time
	lastContactLock sync.RWMutex

	// committedCh chan notify client we have committed
	committedCh  chan struct{}

	// applyCh is used to async send logs to the main thread to
	// be committed and applied to the FSM.
	applyCh chan ApplyMsg

	// stable is a StableStore implementation for durable state
	// It provides stable storage for many fields in raftState
	stable StableStore

	// Used for our logging
	// Logger is a user-provided logger. If nil, a logger writing to
	// LogOutput with LogLevel is used.
	logger hclog.Logger
}
```

## AppendEntries RPC

One important things to define PRC struct is that go RPC sends only struct fields whose names start with **capital letters**. **Sub-structures must also have capitalized field names** (e.g. fields of log records in an array). The `labgob` package will warn you about this; don't ignore the warnings.

![lab2 Raft AppendEntries](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft2.png)

```go
// AppendEntriesArgs is the command used to append entries to the
// replicated log.
type AppendEntriesArgs struct {
	Term         uint64
	LeaderId     int32
	PrevLogIndex uint64 //index of log entry immediately preceding new ones
	PrevLogTerm  uint64 //term of prevLogIndex entry
	Entries      []Log
	LeaderCommit uint64
}

func (arg AppendEntriesArgs) String() string {
	return fmt.Sprintf("Term = %d, LeaderId = %d, PrevLogIndex = %d, PrevLogTerm = %d, LeaderCommit = %d, Entries = %s", arg.Term,arg.LeaderId,arg.PrevLogIndex,arg.PrevLogTerm,arg.LeaderCommit,arg.Entries)
}


type AppendEntriesReply struct {
	ServerID      int
	Term          uint64
	Success       bool

	// optimization: accelerated log backtracking
	ConflictTerm  uint64  // first Log Term that conflicts between follower and leader
	ConflictIndex uint64  // first Log Index that conflicts between follower and leader
}

func (arg AppendEntriesReply) String() string {
	return fmt.Sprintf("ServerID = %d, Term = %d, Success = %v, ConflictTerm = %d, ConflictIndex = %d",
		arg.ServerID,arg.Term,arg.Success,arg.ConflictTerm,arg.ConflictIndex)
}
```

Another important things here is that, for all of the data structure, **attaching a `String()` function to a named struct** allows us to convert a struct to a string. This will help me a lot during debugging!

## RequestVote RPC

![lab2 Raft RequestVote](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft3.png)

```go
// RequestVoteArgs
// example RequestVote RPC arguments structure.
// field names must start with capital letters!
type RequestVoteArgs struct {
	// Your data here (2A, 2B).
	Term uint64
	CandidateId int32
	// Cache the latest log from LogStore
	LastLogIndex uint64
	LastLogTerm  uint64

	// for Debug
	Time time.Time
}
func (arg RequestVoteArgs) String() string {
	return fmt.Sprintf("Term = %d, CandidateId = %v, LastLogIndex = %v, LastLogTerm = %v, request Time = %v",
		arg.Term,arg.CandidateId,arg.LastLogIndex,arg.LastLogTerm, arg.Time)
}

// example RequestVote RPC reply structure.
// field names must start with capital letters!
type RequestVoteReply struct {
	// Your data here (2A).
	Term uint64
	VoteGranted bool
	VoterID uint64

	// for Debug
	Time time.Time
}
func (arg RequestVoteReply) String() string {
	return fmt.Sprintf("Term = %d, VoteGranted = %v, VoterID = %v, reply time = %v",
		arg.Term,arg.VoteGranted,arg.VoterID, arg.Time)
}
```

## InstallSnapshot RPC

In the Raft paper, Snapshots are split into chunks for transmission; this gives the follower a sign of life with each chunk, so it can reset its election timer.

![lab2 Raft InstallSnapshot](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft5.png)

But here, for simplicity, we don't split Snapshots into several chunks. So we don't use the variable `offset` and `done` in this lab.

```go
// InstallSnapshotRequest is the command sent to a Raft peer to bootstrap its
// log (and state machine) from a snapshot on another peer.
type InstallSnapshotRequest struct {
	Term        uint64
	LeaderId    int32    // LeaderId of request

	// These are the last index/term included in the snapshot
	LastLogIndex uint64
	LastLogTerm  uint64

	// Raw byte stream data of snapshot
	Data         []byte

	// Size of the snapshot
	Size         int64

	// true if this is the last chunk
	Done         bool
}

func (arg InstallSnapshotRequest) String() string {
	return fmt.Sprintf("Term = %d, LeaderId = %d, LastLogIndex = %d, LastLogTerm = %d, Data = %v, Size = %d",
		arg.Term,arg.LeaderId,arg.LastLogIndex,arg.LastLogTerm,arg.Data,arg.Size)
}
// InstallSnapshotReply is the response returned from an
// InstallSnapshotRequest.
type InstallSnapshotReply struct {
	Term    uint64
	Success bool
}
func (arg InstallSnapshotReply) String() string {
	return fmt.Sprintf("Term = %d, Success = %v",
		arg.Term,arg.Success)
}
```

# RPC Handler

Our Raft peers should exchange RPCs using the `labrpc` Go package (source in `src/labrpc`). The tester can tell `labrpc` to delay RPCs, re-order them, and discard them to simulate various network failures. 

We use `labrpc.ClientEnd.Call()` to send a request and waits for a reply.  `Call()` is guaranteed to return (perhaps after a delay) *except* if the handler function on the server side does not return.  Thus there is no need to implement your own timeouts around `Call()`.

The labrpc package simulates a lossy network, in which servers may be unreachable, and in which requests and replies may be lost. `Call() `sends a request and waits for a reply. If a reply arrives within a timeout interval, `Call()` returns true; otherwise `Call()`  returns false. **Thus `Call()` may not return for a while**. A false return can be caused by a dead server, a live server that can't be reached, a lost request, or a lost reply.

Since `Call()` may return for a long time, which means the possibility of outdated PRC response. And we apply Go Channel as a medium for goroutines, for example background goroutine that kicking off leader election periodically by sending out `RequestVote` RPCs,  to communicate with each other.  So we should take this condition into account: Peer 1, for example,  sent the `RequestVote` RPCs during the its *leader* lease time and got blocked in `rf.peers[server].Call(...)` clause, but when RPC returned, peer 1 has already been the *follower*, which means this PRC response is outdated and some of the **channels for receiving data** have already been cloesed!

One way to handle this potential bug is to restrict blocked time in RPC handler:

```go
go func() {
		ok := rf.peers[server].Call("Raft.InstallSnapShot", args, reply)
		rstChan <- ok
	}()
select {
  case ok = <-rstChan:
	case <-time.After(rf.config().HeartbeatTimeout):
  //call rpc timeout!!!
  rf.logger.Debug("sent an SnapShot timeout!!","from ", rf.me," to ", server)
}
```

# Server Behavior

At any given time each server is in one of three states: **leader, follower, or candidate**.

- Followers are passive: they issue no requests on their own but simply respond to requests from leaders and candidates. 
- The leader handles all client requests (if a client contacts a follower, the follower redirects it to the leader).
- Candidate is used to elect a new leader.

So the whole Raft module is constructed in a main loop:

```go
//main server loop.
func (rf *Raft) ticker() {
	for rf.killed() == false {

		// Your code here to check if a leader election should
		// be started and to randomize sleeping time using
		// time.Sleep().
		// Check if we are doing a shutdown
		select {
		case <-rf.shutdownCh:
			// Clear the leader to prevent forwarding
			rf.setLeader(-1)
			return
		default:
		}

		switch rf.getState() {
		case Follower:
			rf.runFollower()
		case Candidate:
			rf.runCandidate()
		case Leader:
			rf.runLeader()
		}
	}
}
```

What is left is to code all the behaviors of different states for one server. Figure 2 describes the algorithm more precisely:

![lab2 Raft Rules for Servers](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft4.png)

# Leader Election

Raft uses a heartbeat mechanism to trigger leader election. When servers start up, they **begin as followers** running code  `rf.runFollower()`. A server remains in follower state as long as it receives valid RPCs from a leader or candidate.

 If a follower receives no communication over a period of time called the *election timeout* (in code we use `HeartbeatTimeout` to represent), then it assumes there is no viable leader and begins an election to choose a new leader. After the node elects itself as a candidate, the function  `rf.runCandidate()`executes. 

## runFollower()

Each follower will have a random time to see if the leader's *contact* has been received within a certain period of time(`HeartbeatTimeout`). If the time from the **last contact** exceeds the timeout time, it will enter the *candidate* state:

```go
heartbeatTimer := randomTimeout(r.config().HeartbeatTimeout)
```

```go
case <-heartbeatTimer:
			// Restart the heartbeat timer
			hbTimeout := r.config().HeartbeatTimeout
			heartbeatTimer = randomTimeout(hbTimeout)

			// Check if we have had a successful contact
			lastContact := r.LastContact()
			if time.Now().Sub(lastContact) < hbTimeout {
				//log here
				continue
			}
			// Heartbeat failed! Transition to the candidate state
			//If election timeout elapses without receiving AppendEntries RPC from current leader
			//or granting vote to candidate: convert to candidate
			r.setLeader(-1)
			r.setState(Candidate)
```

Every time the *follower* receives the leader's HeartBeat, AppendEntries, InstallSnapshot and other operations, the `LastContact` time will be updated:

```go
// setLastContact is used to set the last contact time to now
func (r *Raft) setLastContact() {
	r.lastContactLock.Lock()
	r.lastContact = time.Now()
	r.lastContactLock.Unlock()
}
```

```go
func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply){
	...
	// you grant a vote to another peer. restart your election timer
	rf.setLastContact()
}
```

```go
func (rf *Raft) AppendEntries(args *AppendEntriesArgs, reply *AppendEntriesReply){
		...
		//restart your election timer if you get an AppendEntries RPC from the current leader
		rf.setLastContact()
}
```

```go
func (r *Raft) InstallSnapShot(req *InstallSnapshotRequest,reply *InstallSnapshotReply) {
	...
	reply.Success = true
	//restart your election timer if you get an InstallSnapShot RPC from the current leader
	r.setLastContact()
}
```

## runCandidate()

The core logic of the *candidate* is in the `electSelf()` function, where the candidate will first increase its own *term*, and then send RequestVote RPC in parallel to each of the other servers in the cluster., and finally become the leader when the number of votes is greater than 1/2 of the number of nodes.

```go
// electSelf is used to send a RequestVote RPC to all peers, and vote for
// ourself. This has the side affecting of incrementing the current term. The
// response channel returned is used to wait for all the responses (including a
// vote for ourself). This must only be called from the main thread.
func (r *Raft) electSelf() <-chan *RequestVoteReply{
	// Increment the term
	r.setCurrentTerm(r.getCurrentTerm() + 1)

	// Create a response channel
	respCh := make(chan *RequestVoteReply, len(r.peers))

	// Construct the request
	lastIdx, lastTerm := r.getLastEntry()
	req := &RequestVoteArgs{
		Term:         r.getCurrentTerm(),
		CandidateId:  int32(r.me),
		LastLogIndex: lastIdx,
		LastLogTerm:  lastTerm,
	}

	// Construct a function to ask for a vote
	askPeer := func(peerId int) {
		r.goFunc(func() {
			voteReply := &RequestVoteReply{}
			voteReply.VoterID = uint64(peerId)
			err := r.sendRequestVote(peerId, req, voteReply)
			if !err{
				r.logger.Error("failed to make requestVote RPC", "target", peerId,
					"error", err, "term", req.Term)
				voteReply.Term = req.Term
				voteReply.VoteGranted = false
			}
			// note we may be blocked here if target rf has been killed and sendRequestVote will wait,
			// at the same time we are killed and respCh is closed before sendRequestVote returned
			// so we need to double check our state again here
			if r.getState() != Candidate || r.getCurrentTerm() != req.Term{
				r.logger.Warn("obsolete request returned!!!!!!!! ignore it")
				return
			}
			respCh <- voteReply
		})
	}

	// For each peer, request a vote
	for serverId,_:=range r.peers{
		// vote for myself
		if serverId==r.me {
			r.logger.Debug("voting for self", "term", req.Term, "id", r.me)
			// Include our own vote
			respCh <-&RequestVoteReply{
				Term:        req.Term,
				VoteGranted: true,
				VoterID: uint64(serverId),
			}
			r.setVotedFor(int32(r.me))
		}else{
			r.logger.Debug("asking for vote","node ",r.me,  "term", req.Term, "from", serverId)
			askPeer(serverId)
		}
	}
	r.persist()
	return respCh
}
```

The *candidate* process is as follows:

1. send RequestVote RPC to all nodes: elect yourself as the leader and wait for the replies from all other nodes.
2. If in the replies of other nodes, the **term** of their service is greater than the **term** of your own (`vote.Term > r.getCurrentTerm()`), indicating that your election is behind and you are not eligible for the leader, so you set your status to *follower* and update **term** at the same time. Finally exit the candidate process.
3. If the replies from other nodes agree with your own proposal, your *votes* will be increased by one. If the number of *votes* is greater than half of the nodes, it means that your are successfully elected as the leader, and your status is updated to the ***leader***.  Finally exit the candidate process.
4. If the election request times out, exit the candidate process directly.

```go
for r.getState() == Candidate {
		select {
		case vote := <-voteCh:
			// If RPC request or response contains term T > currentTerm:
			//set currentTerm = T, convert to follower (§5.1)
			if vote.Term > r.getCurrentTerm() {
				r.logger.Warn("newer term discovered, fallback to follower", "term", vote.Term)
				r.setState(Follower)
				r.setCurrentTerm(vote.Term)
				r.setLeader(-1)
				r.persist()
				return
			}
			// Check if the vote is granted
			if vote.VoteGranted {
				grantedVotes++
				r.logger.Debug("vote granted", "from", vote.VoterID,
					"term", vote.Term, "tally", grantedVotes)
			}
			// Check if we've become the leader
			if grantedVotes >= votesNeeded {
				r.logger.Info("election won","server [",r.me,"], term", vote.Term, "tally", grantedVotes)
				r.setState(Leader)
				r.setLeader(int32(r.me))
				return
			}
		case <-electionTimer:
			//If election timeout elapses: start new election
			r.logger.Warn("Election timeout reached, restarting election")
			return
		case <-r.shutdownCh:
			r.logger.Warn("candidate server shut down!!","peer",r.me)
			return
		}
}
```

## Safety Argument

Generally, consensus algorithms need to satisfy three basic properties, namely **agreement, integrity, and termination**. These three basic properties can also be summarized into two, namely **Liveness and Safety**. Safety refers to agreement and integrity, which means that the processed proposal comes from the correct node, and the final state of the correct node can always be consistent. 

Raft ensures this security by adding some additional restrictions and measures to the process of leader election and log replication: 

- Make sure the **election timeouts in different peers don't always fire at the same time**, or else all peers will vote only for themselves and no one will become the leader.

- The system should satisﬁes the following **timing requirement:** `broadcastTime ≪ electionTimeout ≪ MTBF`

  The paper's Section 5.2 mentions election timeouts in the range of 150 to 300 milliseconds. Such a range only makes sense if the leader sends heartbeats considerably more often than once per 150 milliseconds. 

  Because the tester limits you to 10 heartbeats per second, we will have to use an **election timeout larger than the paper's 150 to 300 milliseconds**, but not too large, because then you may fail to elect a leader within five seconds.

1. To randomize the election timeouts, we may find Go's [rand](https://golang.org/pkg/math/rand/) useful:

   ```go
   // randomTimeout returns a value that is between the minVal and 2x minVal.
   func randomTimeout(minVal time.Duration) <-chan time.Time {
   	if minVal == 0 {
   		return nil
   	}
   	extra := time.Duration(rand.Int63()) % minVal
   	return time.After(minVal + extra)
   }
   ```

   we can use it like this:

   ```go
   heartbeatTimer := randomTimeout(r.config().HeartbeatTimeout)
   ```

2. Here we give two recommended parameter settings:

   - ElectionTimeout: 150ms-300ms, HeartbeatTimeout: 50ms

   - ElectionTimeout: 200ms-400ms, HeartbeatTimeout: 100ms

   > ref: [lab2-one(%v) failed to reach agreement](https://github.com/springfieldking/mit-6.824-golabs-2018/issues/1)

   ```go
   func DefaultConfig() Config {
   	id := generateUUID()
   	return Config{
   		HeartbeatTimeout:   100 * time.Millisecond,
   		ElectionTimeout:    200 * time.Millisecond,
   		CommitTimeout:      50 * time.Millisecond,
   		LeaderLeaseTimeout: 100 * time.Millisecond,
   		LogLevel:           "DEBUG",
   		LocalID:            ServerID(id),
   		LogOutput:          os.Stderr,
   	}
   }
   ```


# Log Replication

Log replication is initiated by the leader and executed in the function  `rf.runLeader()`. 

The *Leader* process is as follows:

1. Start a replication routine for each peer, calling  `r.startStopReplication()` to perform log replication.

2. Sit in the leader loop until we step down, calling  `r.leaderLoop()`.

3. In `leaderLoop()`, we periodically check out leader state:

   ```go
   for r.getState() == Leader {
     ...
     case <-lease:
     		
     		// Check if we've exceeded the lease, potentially stepping down
   			maxDiff := r.checkLeaderLease()
   
   			// Next check interval should adjust for the last node we've
   			// contacted, without going negative
   			checkInterval := r.config().LeaderLeaseTimeout - maxDiff
   			if checkInterval < minCheckInterval {
   				checkInterval = minCheckInterval
   			}
     
   			r.logger.Info("check lease time","checkInterval",checkInterval)
   			// Renew the lease timer
   			lease = time.After(checkInterval)
   }
   ```

4. When we exit leader state, reset `lastContact`(calling `r.setLastContact()`). Since we were the leader previously, we update our last contact time when we step down, so that **we are not reporting a last contact time from before we were the leader.** Otherwise, to a client it would seem our data is extremely stale.

The core function to perform log replication is `startStopReplication()`:

1. Start a new goroutine, calling `replicate()` to  perform log replication for each node except the leader.

2. The status of each node's AppendEntries RPC is saved through the object `followerReplication`:

   ```go
   // followerReplication is in charge of sending snapshots and log entries from
   // this leader during this particular term to a remote follower.
   type followerReplication struct {
     
   	Term         uint64
   	LeaderId     int32
   	PrevLogIndex uint64
   	PrevLogTerm  uint64
   	LeaderCommit uint64
   
   	Entries      []Log
   	EntriesLock sync.RWMutex
   
   	// getLastContact is updated to the current time whenever any response is
   	// received from the follower (successful or not). This is used to check
   	// whether the leader should step down (Raft.checkLeaderLease()).
   	LastContact time.Time
   	// LastContactLock protects 'getLastContact'.
   	LastContactLock sync.RWMutex
   
   	// failures counts the number of failed RPCs since the last success, which is
   	// used to apply backoff.
   	Failures uint64
   
   	// stopCh is notified/closed when this leader steps down or the follower is
   	// removed from the cluster. In the follower removed case, it carries a log
   	// index; replication should be attempted with a best effort up through that
   	// index, before exiting.
   	stopCh chan uint64
   
   	// stepDown is used to indicate to the leader that we
   	// should step down based on information from a follower.
   	stepDown chan struct{}
   
   	// triggerCh is notified every time new entries are appended to the log.
   	triggerCh chan struct{}
   }
   ```

3. In the function `replicate()` , call  `replicateTo()`  to do log replication via sending *AppendEntries RPC* as soon as the leader receives a new *command* .(After the `replicate()` goroutine detects that there is a message in `triggerCh`, it starts to call  `replicate()` )

4. In the beginning of  `replicate()` , we start an another new goroutine calling function `heartbeat()` to send *heartbeat RPC* to all the followers periodically. 

5. One important issue here is that when 1 new *command* comes in, the function  `replicate()` may still be running in `replicateTo()` due to previous command. Since the channel size of `triggerCh` is 1, if new commands come in so fast,  we will fail to send the new *AppendEntries RPC*  to followers. To address this issue, we have 2 mechanism:

   - Add a new channel `<-randomTimeout(r.config().CommitTimeout)` to send *AppendEntries RPC* periodically for compendation.

   - Instead of sending empty *AppendEntries RPC*  as the **heartbeat RPC**, we will carry new `entries[]` if we have new *command* in leader's logs.

When the leader sends *AppendEntries* to the follower, it will take the adjacent previous log (**we don't actually need the  `Log` object, but only need `PrevLogIndex` and `PrevLogTerm` for consistency check!**). When the follower receives AppendEntries RPC, it will find the previous log entry with same `Term`  and `Index`. 

If it exists and matches, it will accept the log entry; otherwise, after a rejection, the leader decrements `nextIndex` and retries the **AppendEntries RPC**. Eventually `nextIndex` will reach a point where the leader and follower logs match. 

Then the follower deletes all the logs after the `Index` and appends the log entries sent by the leader. Once the logs are appended successfully, all the logs of the follower and the leader are consistent. 

Only after the majority of followers respond to receive the log, indicating that the log can be committed, can leader response to client applying successfully.

## The Importance of Details

1. Follower deleting the existing entry is conditional

Upon receiving a heartbeat, You may truncate the follower’s log following `prevLogIndex`, and then append any entries included in the `AppendEntries` arguments. **This is not correct**. We can once again turn to Figure 2:

> **If an existing entry conflicts with a new one (same index but different terms), delete the existing entry and all that follow it.**

The *if*  here is crucial. **If the follower has all the entries the leader sent**, the follower **MUST NOT** truncate its log. Any elements *following* the entries sent by the leader **MUST** be kept. This is because we could be receiving an outdated `AppendEntries` RPC from the leader, and truncating the log would mean “taking back” entries that we may have already told the leader that we have in our log.

2. Leaders can only commit logs of their own term

Figure 8 use a time sequence showing why a leader cannot determine commitment using log entries from older terms. To eliminate problems like the one in Figure 8, **Raft never commits log entries from previous terms by counting replicas**. Only log entries from the leader’s current term are committed by counting replicas.

![lab2 Raft Figure 8](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/fig8.png)



## Coding Hints

1. One trick here to implement the rules in Figure 2 for Leaders:

> If there exists an N such that `N > commitIndex`, a majority of `matchIndex[i] ≥ N`, and `log[N].term == currentTerm`: set `commitIndex = N` (§5.3, §5.4).

To obtain the majority of `matchIndex[i] ≥ N`, We can sort `matchIndex[]` in the increasing order and then fetch the middle one, which is just the `N` here. And then we can judge if `N > commitIndex `:

```go
matchIndex := rpcArg.PrevLogIndex + uint64(len(rpcArg.Entries))
r.logger.Info("update sever state","sever", reply.ServerID," matchIndex ",matchIndex)
r.leaderState.updateStateSuccess(reply.ServerID,matchIndex)

//If there exists an N such that N > commitIndex, a majority of matchIndex[i] ≥ N,
//and log[N].term == currentTerm: set commitIndex = N (§5.3, §5.4).
copyMatchIndex := make(uint64Slice, len(r.peers))
r.leaderState.indexLock.Lock()
copy(copyMatchIndex, r.leaderState.matchIndex)
r.leaderState.indexLock.Unlock()
copyMatchIndex[r.me] = r.getLastIndex()

//sort and get the middle to judge the majority
sort.Slice(copyMatchIndex, copyMatchIndex.Less)
N := copyMatchIndex[len(r.peers)/2]
r.logger.Debug("check returned matchIndex","copyMatchIndex",copyMatchIndex)

// convert to offset due to log compact
offset := N - 1 - base
if N > r.getCommitIndex() && currentLogs[offset].Term == currentTerm {
  r.setCommitIndex(N)
}
```

2. The code have loops that repeatedly check for certain events. Don't have these loops execute continuously without pausing, since that will slow your implementation enough that it fails tests. We insert a time waiting in each loop iteration:

```go
func (r *Raft) heartbeat(id int, s *followerReplication, stopCh chan struct{}){
  ...
  for s.Term == r.getCurrentTerm(){
		r.logger.Debug("heartbeat show current followerReplication data","peer", id, " followerReplication",s)
		// Don't have these loops execute continuously without pausing
		// Wait for the next heartbeat interval or forced notify
		select {
		case <-randomTimeout(r.config().HeartbeatTimeout / 4):
		case <-stopCh:
			r.logger.Warn("replicate stopped heartbeat","leader",r.me," peer",id)
			return
		}
		// each command is sent to each peer just once.
		// heartbeat does not send entries
		if r.getState() != Leader { // has already stepped down
			r.logger.Warn("close heartbeat due to transferring to follower")
			return
		}
		...
}
```

3. If `commitIndex > lastApplied` *at any point* during execution, we should apply a particular log entry. It is not crucial that you do it straight away (for example, in the `AppendEntries` RPC handler), but it is important that you ensure that this application is only done by one entity.  Specifically, **we have a dedicated “applier”:`startApplyLogs()`**, so that some other routine doesn’t also detect that entries need to be applied and also tries to apply:

   ```go
   func (rf *Raft) startApplyLogs() {
   	// dedicated thread calling r.app.apply from Raft
   	rf.goFunc(func() {
   		for {
   			select {
   			case <- rf.applyLogCh:
   
   				// may only be partially submitted
   				lastApplied := rf.getLastApplied()
   
   				for lastApplied < rf.getCommitIndex(){
   					newLastApplied := lastApplied + 1
   
   					msg := ApplyMsg{}
   					msg.CommandValid = true
   					msg.SnapshotValid = false
   					msg.CommandIndex = int(newLastApplied)
   
   					entry := rf.getEntryByOffset(newLastApplied)
   					msg.Command = entry.Data
   
   					// Update the last log since it's on disk now
   					rf.setLastApplied(newLastApplied)
   
   					rf.applyCh <- msg
   
   					lastApplied = newLastApplied
   				}
           
   			case <-rf.shutdownCh:
   				rf.logger.Warn("startApplyLogs goroutine shut down!!","peer",rf.me)
   				return
   			}
   		}
   	})
   }
   ```

## Accelerated Log Backtracking 

To optimize accelerated log backtracking, we can follow these steps:

1. If a follower **does not** have `prevLogIndex` in its log, it should return with `conflictIndex = len(log)` and `conflictTerm = None`.

   ```go
   if lastSnapshotIndex > args.PrevLogIndex || lastLogIndex < args.PrevLogIndex {
     
     reply.Term = currentTerm
     
     reply.Success = false
     
     // If a follower does not have prevLogIndex in its log
     // it should return with conflictIndex = lastLogIndex + 1 and conflictTerm = None
     reply.ConflictIndex = lastLogIndex + 1
     
     reply.ConflictTerm = 0 //represent conflictTerm = None.
   
     rf.persist()
     return
   }
   ```

2. If a follower does have `prevLogIndex` in its log, but the **term does not match**, it should return `conflictTerm = log[prevLogIndex].Term`, and then search its log for the first index whose entry has term equal to `conflictTerm`.

   ```go
   func getConflictTermIndex(conflictTerm uint64,logEntries []Log) uint64 {
     
   	// all the indexes start from 1, so 0 means no conflict
   	conflictIndex := uint64(0)
     
   	for i:=0; i<len(logEntries); i++ {
   		if logEntries[i].Term == conflictTerm {
         
   			// conflictIndex = uint64(i + 1)
   			// conflictIndex is the actual index of the log !
   			conflictIndex = logEntries[i].Index
         
   			break
   		}
   	}
     
   	return conflictIndex
   }
   ```

   ```go
   if args.PrevLogTerm != prevLogTerm {
   		
       reply.Term = currentTerm
     
   		reply.Success = false
     
   		// If a follower does have prevLogIndex in its log, but the term does not match,
   		// it should return conflictTerm = log[prevLogIndex - 1].Term
   		reply.ConflictTerm = prevLogTerm
     
       // then search its log for the first index whose entry has term equal to conflictTerm.
   		reply.ConflictIndex = getConflictTermIndex(prevLogTerm,originLogEntries)
   
   		rf.persist()
   		return
   }
   ```

3. Upon receiving a conflict response, the leader should first search its log for `conflictTerm`. If it finds an entry in its log with that term, it should set `nextIndex` to be the one beyond the index of the ***last entry* ** in that term in its log.

4. If it does not find an entry with that term, it should set `nextIndex = conflictIndex`.

   ```go
   func (r *Raft) lastConfictTermIndex(conflictTerm uint64) (uint64,bool) {
   	entries := r.getLogEntries()
   	founded := false
     
   	for i:=0; i<len(entries); i++{
       
   		if entries[i].Term==conflictTerm {
   			founded = true
   		}
       
   		if entries[i].Term > conflictTerm{
   			//return uint64(i + 1),founded
   			return entries[i].Index,founded
   		}
       
   	}
     
   	return 0,founded
   }
   ```

   ```go
   //If AppendEntries fails because of log inconsistency:
   //decrement nextIndex and retry (§5.3)
   
   // The accelerated log backtracking optimization
   // Upon receiving a conflict response, the leader should first search its log for conflictTerm.
   upperboundIndex, founded := r.lastConfictTermIndex(reply.ConflictTerm)
   
   if founded {
     // If it finds an entry in its log with ConflictTerm,
   	// it should set nextIndex as the one beyond the index of the last entry in that term in its log.
   	r.leaderState.setNextIndex(reply.ServerID, upperboundIndex)
   } else {
     r.leaderState.setNextIndex(reply.ServerID, reply.ConflictIndex)
   }
   ```

# Persistence

For the persistent content of the state, it is provided by the Figure 2 at the *State* part : `currentTerm`,`voteFor` and `log[]`. Besides, in *InstallSnapshot*, we also need to persist `lastIncludedIndex` and `lastIncludedTerm` in order to let server be able to restore the original state after the machine reboots. 

```go
func (rf *Raft) persistData() []byte {
	w := new(bytes.Buffer)
	e := gob.NewEncoder(w)
	e.Encode(rf.currentTerm)
	e.Encode(rf.votedFor)
	e.Encode(rf.logs)
	e.Encode(rf.lastSnapshotIndex)
	e.Encode(rf.lastSnapshotTerm)
	data := w.Bytes()
	return data
}
```

And of course we should call `persist()` every time these contents of the state change.

# Log Compaction

Raft implements log compaction through snapshot. Server persistently store a "snapshot" of their state from time to time, at which point Raft discards log entries that precede the snapshot.The result is a smaller amount of persistent data and faster restart. 

However, it's now possible for a **follower to fall so far behind that the leader** has discarded the log entries it needs to catch up; **the leader must then send a snapshot plus the log starting at the time of the snapshot.** 

In Raft paper, Figure 12 can be a good illustration of the role of snapshots:

![lab2 Raft Figure 12](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft12.png)

Simple explanation: 

Suppose now that the updated information of x and y is stored in the log. The information of x is 3, 2, 0, 5 in sequence. The information of y is 1, 9, and 7 in sequence. And the *logs* with subscripts 1~ 5 have been committed, indicating that this log is no longer needed for the current node. 

Then we access the last stored information as the *snapshot* (`persister.SaveStateAndSnapshot()`), that is, x=0, y=9, and record the log index (`lastIncludedIndex`) of the last snapshot storage and its corresponding term(`lastIncludedTerm`). At this point, our new *logs* only store the uncommitted index of 6 and 7, and the length of the *logs* has changed from 7 to 2.

We can start with the diagram of Raft interactions as mentioned above:

![lab2 Raft interactions](https://cdn.jsdelivr.net/gh/hswsp/IMAGE_HOST@main/img/raft-server.png)

## Functions to Implement

Lab 2 require us to implement `Snapshot()` ,`CondInstallSnapshot()` and the ***InstallSnapshot RPC***.

`Snapshot()` is actually called by the service to Raft, so that the Raft node updates its own snapshot information. Some one might argue that this violates Raft's principles of strong leadership. Because followers can update their own snapshots without the leader's knowledge. But in fact, this situation is reasonable. **Updating the snapshot is only to update the data, which does not conflict with reaching a consensus. Data still only flows from the leader to the followers**, followers just take snapshots to lighten their burden of storage. 

The *snapshot* you send will be uploaded to `applyCh`, and at the same time your *AppendEntries* will also need to upload logs to `applyCh`, , which may cause conflicts. `CondInstallSnapshot()` is called to avoid the requirement that snapshots and log entries sent on `applyCh` are coordinated。But in fact, as long as you synchronize well when apply, adding a mutex, then this problem can be avoided. So you are discouraged from implementing it: instead, we suggest that you simply have it return true.

you need to send a ***InstallSnapshot RPC*** is actually when the log that the leader sends to the follower has been discarded. We add function `leaderSendSnapShot(server int)` to send the InstallSnapshot RPC.  So where`leaderSendSnapShot()` called to send the snapshot should be during consistency check performed by AppendEntries RPCs. The condition is that *nextIndex* is lower than leader's snapshot: `rf.nextIndex[server] < rf.lastIncludeIndex` 

```go
if nextIndex < lastIncludeIndex{
		r.logger.Info("InstallSnapShot to followers","leader",r.me," peer",serverID,
			"current term",r.getCurrentTerm()," Replication RPC term",s.Term)
		r.goFunc(func() {r.leaderSendSnapShot(serverID)})
		return shouldStop
}
```

## Subscript Tips

Every time you update *logs* during AppendEntries RPC process, you must take the subscript of the snapshot into count. There are two points you need to take into carefully consideration:

1. After snapshot, the index(offset) of your log entries `log[]` should no longer be euqal to `Index` field of your `type Log struct`.  Only `Log.Index` is actually the global index of all of your log entries.

2. **You need to do index conversion** everywhere you use `log[]`  in functions that process RPCs, like `func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply)` and `func (rf *Raft) AppendEntries(args *AppendEntriesArgs, reply *AppendEntriesReply)`.

   For example, if you want to fetch `Term` according to `Log.Index`, you can use:

   ```go
   //get log term by index after snapshot
   func (rf *Raft) getLogTermByIndex(index uint64) uint64 {
     
   	rf.lastLock.Lock()
   	var offset int64
   	offset = int64(index)-int64(1 + rf.lastSnapshotIndex)  // may overflow here, caution!!!!
     
   	if offset < 0 {
   		rf.lastLock.Unlock()
   		return rf.lastSnapshotTerm
   	}
   	rf.lastLock.Unlock()
   
   	rf.logsLock.Lock()
   	defer rf.logsLock.Unlock()
   	return rf.logs[offset].Term
   }
   ```

# Reference

1. [hashicorp-raft](https://github.com/hashicorp/raft)
2.  [extended Raft paper](https://pdos.csail.mit.edu/6.824/papers/raft-extended.pdf)
3.  [students-guide-to-raft](https://thesquareplanet.com/blog/students-guide-to-raft/)
