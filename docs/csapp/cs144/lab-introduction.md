---
title: "Lab Introduction"
description: "CS144 lab 总览、协作政策与开发环境准备。"
---

[**Welcome to CS144: Introduction to Computer Networking. **](https://cs144.github.io/)

In this warmup, you will set up an installation of GNU/Linux on your computer, learn how to perform some tasks over the Internet by hand, write a small program in C++ that fetches a Web page over the Internet, and implement (in memory) one of the key abstractions of networking: a reliable stream of bytes between a writer and a reader. We expect this warmup to take you between 2 and 6 hours to complete (future labs will take more of your time). Three quick points about the lab assignment:

+ It’s a good idea to read the whole document before diving in!
+ Over the course of this 8-part lab assignment, you’ll be building up your own implementation of a significant portion of the Internet—a router, a network interface, and the TCP protocol (which transforms unreliable datagrams into a reliable byte stream). Most weeks will build on work you have done previously, i.e., you are building up your own implementation gradually over the course of the quarter, and you’ll continue to use your work in future weeks. This makes it hard to “skip” a checkpoint.
+ If you don’t meet the CS144 prerequisites, please don’t take this class yet—our teaching staff’s resources are limited. And please use checkpoints 0 and 1 as a gauge: if you find yourself uncomfortable with the programming in the first two checkpoints, please consider taking CS144 in a later year after you’ve attained more comfort with this kind of programming (perhaps after taking CS 106L, embarking on a self-directed programming project, or otherwise building up your comfort and experience level).
+ The lab documents aren’t “specifications”—meaning they’re not intended to be consumed in a one-way fashion. They’re written closer to the level of detail that a software engineer will get from a boss or client. We expect that you’ll benefit from attending the lab sessions and asking clarifying questions if you find something to be ambiguous and you think the answer matters. We’ll update the “lab FAQ” document on the [course website](https://cs144.stanford.edu/) in response to late questions that need clarification.

# Collaboration Policy
**The programming assignments must be your own work**: You must write all the code you hand in for the programming assignments, except for the code that we give you as part of the assignment. Please do not copy-and-paste code from Stack Overflow, GitHub, or other sources. If you base your own code on examples you find on the Web or elsewhere, cite the URL in a comment in your submitted source code. 

**Working with others**: You may not show your code to anyone else, look at anyone else’s code, or look at solutions from previous years. You may discuss the assignments with other students, but do not copy anybody’s code. If you discuss an assignment with another student, please name them in a comment in your submitted source code. Please refer to the course administrative handout for more details, and ask on EdStem if anything is unclear. Services like GitHub Copilot or ChatGPT should be considered to be equivalent to “a student that took CS144 in a prior year.” 

**EdStem**: Please feel free to ask questions on EdStem, but please don’t post any source code.

# Set up GNU/Linux on your computer
Let’s get started with using the network. You are going to do two tasks by hand: retrieving a Web page (just like a Web browser) and sending an email message (like an email client). Both of these tasks rely on a networking abstraction called a reliable bidirectional byte stream: you’ll type a sequence of bytes into the terminal, and the same sequence of bytes will eventually be delivered, in the same order, to a program running on another computer (a server). The server responds with its own sequence of bytes, delivered back to your terminal.

## 2.1 Fetch a Web page
1. In a Web browser, visit [http://cs144.keithw.org/hello](http://cs144.keithw.org/hello) and observe the result.
2. Now, you’ll do the same thing the browser does, by hand.
    1. On your VM (or on your own computer—e.g. the Terminal program on macOS), run `telnet cs144.keithw.org http` . This tells the telnet program to open a reliable byte stream between your computer and another computer (named cs144.keithw.org), and with a particular service running on that computer: the “http” service, for the Hyper-Text Transfer Protocol, used by the World Wide Web.

If your computer has been set up properly and is on the Internet, you will see:

```bash
user@computer:~$ telnet cs144.keithw.org http
Trying 104.196.238.229...
Connected to cs144.keithw.org.
Escape character is '^]'.
```

If you need to quit, hold down `ctrl` and press `]` , and then type `close(Enter/<font style="color:rgb(46, 46, 46);">↩</font>)`.

    2. Type `GET /hello HTTP/1.1 <font style="color:rgb(46, 46, 46);">↩</font><font style="color:rgb(46, 46, 46);"></font>` . This tells the server the path part of the URL. (The part starting with the third slash.)
    3. Type `Host: cs144.keithw.org <font style="color:rgb(46, 46, 46);">↩</font><font style="color:rgb(46, 46, 46);"></font>` . This tells the server the host part of the URL. (The part between http:// and the third slash.)
    4. Type `Connection: close <font style="color:rgb(46, 46, 46);">↩</font><font style="color:rgb(46, 46, 46);"></font>` . This tells the server that you are finished making requests, and it should close the connection as soon as it finishes replying.
    5. Hit the Enter key one more time: `<font style="color:rgb(46, 46, 46);">↩</font>`. This sends an empty line and tells the server that you are done with your HTTP request.
    6. If all went well, you will see the same response that your browser saw, preceded by HTTP headers that tell the browser how to interpret the response.
3. **Assignment**: Now that you know how to fetch a Web page by hand, show us you can! Use the above technique to fetch the URL [http://cs144.keithw.org/lab0/sunetid](http://cs144.keithw.org/lab0/sunetid), replacing sunetid with your own primary SUNet ID. You will receive a secret code in the X-Your-Code-Is: header. Save your SUNet ID and the code for inclusion in your writeup.

## Send yourself an email
Now that you know how to fetch a Web page, it’s time to send an email message, again using a reliable byte stream to a service running on another computer.

SSH to `sunetid@cardinal.stanford.edu` (to make sure you are on Stanford’s network), then run `telnet 148.163.153.234 smtp` . The “smtp” service refers to the **Simple Mail Transfer Protocol**, used to send email messages. If all goes well, you will see:

```bash
user@computer:~$ telnet 148.163.153.234 smtp
Trying 148.163.153.234...
Connected to 148.163.153.234.
Escape character is '^]'.
220 mx0b-00000d03.pphosted.com ESMTP mfa-m0214089
```

First step: identify your computer to the email server. Type `HELO mycomputer.stanford.edu <font style="color:rgb(46, 46, 46);">↩</font>` . Wait to see something like “`250 ... Hello cardinal3.stanford.edu [171.67.24.75], pleased to meet you`”.

Next step: who is sending the email? Type `MAIL FROM: sunetid @stanford.edu <font style="color:rgb(46, 46, 46);">↩</font>`. Replace sunetid with your SUNet ID. If all goes well, you will see “250 2.1.0 Sender ok”.

Next: who is the recipient? For starters, try sending an email message to yourself. Type `RCPT TO: sunetid @stanford.edu <font style="color:rgb(46, 46, 46);">↩</font>`. Replace sunetid with your own SUNet ID. If all goes well, you will see “250 2.1.5 Recipient ok.”

It’s time to upload the email message itself. Type `DATA <font style="color:rgb(46, 46, 46);">↩</font>` to tell the server you’re ready to start. If all goes well, you will see “`354 End data with <font style="color:rgb(167, 167, 167);"><CR><LF>.<CR><LF></font>`”.

Now you are typing an email message to yourself. First, start by typing the headers that you will see in your email client. Leave a blank line at the end of the headers.

```bash
354 End data with <CR><LF>.<CR><LF>
From: sunetid@stanford.edu
To: sunetid@stanford.edu
Subject: Hello from CS144 Lab 0!
```

Type the body of the email message—anything you like. When finished, end with a dot on a line by itself: `. <font style="color:rgb(46, 46, 46);">↩</font>`. Expect to see something like: “250 2.0.0 33h24dpdsr-1 Message accepted for delivery”

Type `QUIT <font style="color:rgb(46, 46, 46);">↩</font>` to end the conversation with the email server. Check your inbox and spam folder to make sure you got the email.

**Assignment**: Now that you know how to send an email by hand to yourself, try sending one to a friend or lab partner and make sure they get it. Finally, show us you can send one to us. Use the above technique to send an email, from yourself, to cs144grader@gmail.com.

## Listening and connecting
You’ve seen what you can do with `telnet`: a **client** program that makes outgoing connections to programs running on other computers. Now it’s time to experiment with being a simple **server**: the kind of program that waits around for clients to connect to it.

In one terminal window, run `netcat -v -l -p 9090` on your VM. You should see:

```bash
user@computer:~$ netcat -v -l -p 9090
Listening on [0.0.0.0] (family 0, port 9090)
```

Leave netcat running. In another terminal window, run `telnet localhost 9090` (also on your VM).

If all goes well, the netcat will have printed something like “Connection from localhost 53500 received!”

Now try typing in either terminal window—the `netcat` (server) or the `telnet` (client). Notice that anything you type in one window appears in the other, and vice versa. You’ll have to hit `<font style="color:rgb(46, 46, 46);">↩</font>`<font style="color:rgb(46, 46, 46);"> </font>for bytes to be transfered.

In the netcat window, quit the program by typing `ctrl -C` . Notice that the telnet program immediately quits as well.

