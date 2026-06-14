# Lab Checkpoint 0: networking warmup

Welcome to CS144: Introduction to Computer Networking. In this warmup, you will set
up an installation of Linux on your computer, learn how to perform some tasks over the
Internet by hand, write a small program in C++ that fetches a Web page over the Internet,
and implement (in memory) one of the key abstractions of networking: a reliable stream of
bytes between a writer and a reader. We expect this warmup to take you between 2 and 6
hours to complete (future labs will take more of your time). Three quick points about the
lab assignment:

- It’s a good idea to read the whole document before diving in!
- Over the course of this 8-part lab assignment, you’ll be building up your own imple-
mentation of a significant portion of the Internet—a router, a network interface, and
the TCP protocol (which transforms unreliable datagrams into a reliable byte stream).
*Most weeks will build on work you have done previously*, i.e., you are building up your
own implementation gradually over the course of the quarter, and you’ll continue to
use your work in future weeks. This makes it hard to “skip” a checkpoint.
- The lab documents aren’t “specifications”—meaning they’re not intended to be con-
sumed in a one-way fashion. They’re written closer to the level of detail that a software
engineer will get from a boss or client. We expect that you’ll benefit from attending the
lab sessions and asking clarifying questions if you find something to be ambiguous and
you think the answer matters. We’ll update the “lab FAQ” document on the [course](https://cs144.github.io/)[website](https://cs144.github.io/) in response to late questions that need clarification.
