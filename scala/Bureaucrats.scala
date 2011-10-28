object Bureaucrats {
  val limit = 5000
  // result in seconds
  def time(fn: => Unit): Double = {
    val start = System.nanoTime
    fn
    (System.nanoTime - start) / 1.0E9
  }
  def benchmark() {
    val a = new Bureaucrats
    var ticks = 0
    while(ticks < limit) {
      a.go()
      ticks += 1
    }
  }
  def main(args: Array[String]) {
    while(true)
      println(5000 / time(benchmark()) + " steps/second")
  }
}

class Bureaucrats {
  val dim = 100
  val N = Array.fill(dim)(Array.fill(dim)(2))
  def rand = util.Random.nextInt(dim)
  var total = 2 * dim * dim
  def go() {
    var active = List((rand, rand))
    N(active.head._1)(active.head._2) += 1
    total += 1
    while(active.nonEmpty) {
      var nextActive = collection.mutable.ListBuffer[(Int, Int)]()
      val overloaded = active.filter(coords => N(coords._1)(coords._2) > 3)
      for((x, y) <- overloaded) {
        N(x)(y) -= 4
        total += 4
        def offLoadToNeighbor(dx: Int, dy: Int) = {
          val x2 = x + dx
          val y2 = y + dy
          if(x2 >= 0 && x2 < dim && y2 >= 0 && y2 < dim) {
            N(x2)(y2) += 1
            total += 1
            nextActive += ((x2, y2))
          }
        }
        offLoadToNeighbor(1, 0)
        offLoadToNeighbor(-1, 0)
        offLoadToNeighbor(0, 1)
        offLoadToNeighbor(0, -1)
      }
      active = nextActive.toList.distinct
    }
  }
}
